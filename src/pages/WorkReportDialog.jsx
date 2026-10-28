
import { useEffect, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

import {
    getWorkReport,
    saveWorkReportDraft,
    uploadWorkReportAttachment,
    downloadWorkReportAttachment,
    submitWorkReport,
} from "../api/requestApi";

const EMPTY_FORM = {
    diagnosis: "",
    failureCause: "",
    performedWork: "",
    workResult: "",
    recommendations: "",
    masterComment: "",
    completedAt: "",
};

function getErrorMessage(error) {
    if (error?.status === 401) {
        return "Сессия истекла. Войдите в систему повторно.";
    }

    if (error?.status === 403) {
        return "У вас нет прав для изменения этого отчёта.";
    }

    if (error?.status === 404) {
        return "Заявка или отчёт не найдены.";
    }

    if (error?.isNetworkError) {
        return "Не удалось связаться с сервером. Проверьте подключение.";
    }

    return error?.message || "Не удалось выполнить операцию.";
}

function toDateTimeLocal(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().slice(0, 16);
}

function toLocalDateTimeString(value) {
    if (!value) {
        return null;
    }

    // LocalDateTime на backend ожидает строку без часового пояса.
    return value.length === 16 ? `${value}:00` : value;
}

function reportStatusLabel(status) {
    switch (status) {
        case "DRAFT":
            return "Черновик";
        case "SUBMITTED":
            return "Отправлен";
        case "ACCEPTED":
            return "Принят";
        case "REWORK_REQUESTED":
            return "Требуется доработка";
        default:
            return status || "Не создан";
    }
}

export default function WorkReportDialog({
    open,
    request,
    onClose,
    onSubmitted,
}) {
    const requestId = request?.id;

    const [form, setForm] = useState(EMPTY_FORM);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [file, setFile] = useState(null);

    const attachments = Array.isArray(report?.attachments)
        ? report.attachments
        : [];

    const editable =
        request?.status === "IN_PROGRESS" &&
        (!report?.status || report.status === "DRAFT");

    function applyReport(data) {
        setReport(data || null);

        setForm({
            diagnosis: data?.diagnosis || "",
            failureCause: data?.failureCause || "",
            performedWork: data?.performedWork || "",
            workResult: data?.workResult || "",
            recommendations: data?.recommendations || "",
            masterComment: data?.masterComment || "",
            completedAt: toDateTimeLocal(data?.completedAt),
        });
    }

    async function loadReport() {
        if (!requestId) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await getWorkReport(requestId);
            applyReport(data);
        } catch (loadError) {
            if (loadError?.status === 404) {
                applyReport(null);
            } else {
                setError(getErrorMessage(loadError));
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!open || !requestId) {
            setForm(EMPTY_FORM);
            setReport(null);
            setFile(null);
            setError("");
            setSuccess("");
            return;
        }

        setFile(null);
        setSuccess("");
        loadReport();

        // loadReport намеренно запускается при открытии нужной заявки.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, requestId]);

    function handleChange(field) {
        return (event) => {
            const value = event.target.value;

            setForm((previous) => ({
                ...previous,
                [field]: value,
            }));
        };
    }

    function validateForm() {
        if (!form.diagnosis.trim()) {
            return "Заполни результаты диагностики.";
        }

        if (!form.performedWork.trim()) {
            return "Укажи выполненные работы.";
        }

        if (!form.workResult.trim()) {
            return "Укажи результат ремонта.";
        }

        return "";
    }

    function getPayload() {
        return {
            diagnosis: form.diagnosis.trim(),
            failureCause: form.failureCause.trim(),
            performedWork: form.performedWork.trim(),
            workResult: form.workResult.trim(),
            recommendations: form.recommendations.trim(),
            masterComment: form.masterComment.trim(),
            completedAt: toLocalDateTimeString(form.completedAt),
        };
    }

    async function handleSaveDraft() {
        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return false;
        }

        setBusy(true);
        setError("");
        setSuccess("");

        try {
            const data = await saveWorkReportDraft(
                requestId,
                getPayload()
            );

            if (data) {
                applyReport(data);
            } else {
                await loadReport();
            }

            setSuccess("Черновик отчёта сохранён.");
            return true;
        } catch (saveError) {
            setError(getErrorMessage(saveError));
            return false;
        } finally {
            setBusy(false);
        }
    }

    async function handleUpload() {
        if (!file) {
            setError("Сначала выбери файл.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("Максимальный размер файла — 10 МБ.");
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError("Разрешены только JPG, PNG, WEBP и PDF.");
            return;
        }

        const validationError = validateForm();

        if (validationError) {
            setError(
                `${validationError} Заполни обязательные поля и сохрани отчёт перед загрузкой файла.`
            );
            return;
        }

        setBusy(true);
        setError("");
        setSuccess("");

        try {
            const savedReport = await saveWorkReportDraft(
                requestId,
                getPayload()
            );

            if (savedReport) {
                setReport(savedReport);
            }

            await uploadWorkReportAttachment(requestId, file);

            setFile(null);
            await loadReport();

            setSuccess("Файл прикреплён к отчёту.");
        } catch (uploadError) {
            setError(getErrorMessage(uploadError));
        } finally {
            setBusy(false);
        }
    }

    async function handleSubmit() {
        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        const confirmed = window.confirm(
            "Отправить отчёт? После отправки редактирование будет недоступно."
        );

        if (!confirmed) {
            return;
        }

        setBusy(true);
        setError("");
        setSuccess("");

        try {
            await saveWorkReportDraft(requestId, getPayload());
            await submitWorkReport(requestId);

            setSuccess("Отчёт отправлен.");

            await onSubmitted?.(requestId);
        } catch (submitError) {
            setError(getErrorMessage(submitError));
        } finally {
            setBusy(false);
        }
    }

    function renderSnapshot(label, value) {
        if (!value) {
            return null;
        }

        return (
            <Box key={label}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                >
                    {label}
                </Typography>

                <Typography sx={{ overflowWrap: "anywhere" }}>
                    {value}
                </Typography>
            </Box>
        );
    }

    return (
        <Dialog
            open={open}
            onClose={() => !busy && onClose()}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                >
                    <Box>
                        <Typography variant="h6" fontWeight={800}>
                            Отчёт мастера
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Заявка №{" "}
                            {request?.requestNumber ??
                                request?.number ??
                                requestId}
                        </Typography>
                    </Box>

                    <Chip
                        label={reportStatusLabel(report?.status)}
                        color={
                            report?.status === "SUBMITTED"
                                ? "success"
                                : "default"
                        }
                    />
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2}>
                    {error && (
                        <Alert
                            severity="error"
                            onClose={() => setError("")}
                        >
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert
                            severity="success"
                            onClose={() => setSuccess("")}
                        >
                            {success}
                        </Alert>
                    )}

                    {loading ? (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                py: 5,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            {(report?.problemSnapshot ||
                                report?.equipmentSnapshot ||
                                report?.addressSnapshot) && (
                                <Box
                                    sx={{
                                        p: 2,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                    }}
                                >
                                    <Typography
                                        fontWeight={700}
                                        mb={1}
                                    >
                                        Данные заявки
                                    </Typography>

                                    <Stack spacing={1}>
                                        {renderSnapshot(
                                            "Описание проблемы",
                                            report.problemSnapshot
                                        )}

                                        {renderSnapshot(
                                            "Оборудование",
                                            report.equipmentSnapshot
                                        )}

                                        {renderSnapshot(
                                            "Адрес",
                                            report.addressSnapshot
                                        )}
                                    </Stack>
                                </Box>
                            )}

                            {!editable && (
                                <Alert severity="info">
                                    {request?.status !== "IN_PROGRESS"
                                        ? "Редактирование отчёта доступно только для заявки со статусом «В работе»."
                                        : "Отчёт уже отправлен и недоступен для редактирования."}
                                </Alert>
                            )}

                            <TextField
                                label="Диагностика *"
                                value={form.diagnosis}
                                onChange={handleChange("diagnosis")}
                                multiline
                                minRows={2}
                                fullWidth
                                disabled={!editable || busy}
                            />

                            <TextField
                                label="Причина неисправности"
                                value={form.failureCause}
                                onChange={handleChange("failureCause")}
                                multiline
                                minRows={2}
                                fullWidth
                                disabled={!editable || busy}
                            />

                            <TextField
                                label="Выполненные работы *"
                                value={form.performedWork}
                                onChange={handleChange("performedWork")}
                                multiline
                                minRows={3}
                                fullWidth
                                disabled={!editable || busy}
                            />

                            <TextField
                                label="Результат ремонта *"
                                value={form.workResult}
                                onChange={handleChange("workResult")}
                                multiline
                                minRows={2}
                                fullWidth
                                disabled={!editable || busy}
                            />

                            <TextField
                                label="Рекомендации клиенту"
                                value={form.recommendations}
                                onChange={handleChange("recommendations")}
                                multiline
                                minRows={2}
                                fullWidth
                                disabled={!editable || busy}
                            />

                            <TextField
                                label="Комментарий мастера"
                                value={form.masterComment}
                                onChange={handleChange("masterComment")}
                                multiline
                                minRows={2}
                                fullWidth
                                disabled={!editable || busy}
                            />

                            <TextField
                                label="Дата и время завершения работ"
                                type="datetime-local"
                                value={form.completedAt}
                                onChange={handleChange("completedAt")}
                                fullWidth
                                disabled={!editable || busy}
                                slotProps={{
                                    inputLabel: { shrink: true },
                                }}
                            />

                            <Divider />

                            <Box>
                                <Typography fontWeight={700} mb={1}>
                                    Фото и документы
                                </Typography>

                                <Stack
                                    direction={{
                                        xs: "column",
                                        sm: "row",
                                    }}
                                    spacing={1}
                                    alignItems={{
                                        xs: "stretch",
                                        sm: "center",
                                    }}
                                >
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        startIcon={<AttachFileIcon />}
                                        disabled={!editable || busy}
                                    >
                                        Выбрать файл

                                        <input
                                            hidden
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                                            onChange={(event) =>
                                                setFile(
                                                    event.target.files?.[0] ||
                                                        null
                                                )
                                            }
                                        />
                                    </Button>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ overflowWrap: "anywhere" }}
                                    >
                                        {file
                                            ? file.name
                                            : "JPG, PNG, WEBP или PDF, до 10 МБ"}
                                    </Typography>

                                    <Button
                                        variant="contained"
                                        onClick={handleUpload}
                                        disabled={
                                            !editable || busy || !file
                                        }
                                    >
                                        Прикрепить
                                    </Button>
                                </Stack>

                                {attachments.length > 0 && (
                                    <Stack spacing={1} mt={2}>
                                        {attachments.map((attachment) => (
                                            <Stack
                                                key={attachment.id}
                                                direction={{
                                                    xs: "column",
                                                    sm: "row",
                                                }}
                                                spacing={1}
                                                alignItems={{
                                                    xs: "stretch",
                                                    sm: "center",
                                                }}
                                                justifyContent="space-between"
                                                sx={{
                                                    p: 1.25,
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    borderRadius: 1.5,
                                                }}
                                            >
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography
                                                        sx={{
                                                            overflowWrap:
                                                                "anywhere",
                                                        }}
                                                    >
                                                        {attachment.originalFileName}
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {Math.ceil(
                                                            (attachment.sizeBytes ||
                                                                0) / 1024
                                                        )}{" "}
                                                        КБ
                                                    </Typography>
                                                </Box>

                                                <Button
                                                    size="small"
                                                    startIcon={
                                                        <DownloadOutlinedIcon />
                                                    }
                                                    disabled={busy}
                                                    onClick={async () => {
                                                        setError("");

                                                        try {
                                                            await downloadWorkReportAttachment(
                                                                requestId,
                                                                attachment.id,
                                                                attachment.originalFileName
                                                            );
                                                        } catch (downloadError) {
                                                            setError(
                                                                getErrorMessage(
                                                                    downloadError
                                                                )
                                                            );
                                                        }
                                                    }}
                                                >
                                                    Скачать
                                                </Button>
                                            </Stack>
                                        ))}
                                    </Stack>
                                )}
                            </Box>
                        </>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    p: 2,
                    flexWrap: "wrap",
                    gap: 1,
                }}
            >
                <Button
                    onClick={onClose}
                    disabled={busy}
                    sx={{ textTransform: "none" }}
                >
                    Закрыть
                </Button>

                <Box sx={{ flex: 1 }} />

                <Button
                    variant="outlined"
                    startIcon={<SaveOutlinedIcon />}
                    onClick={handleSaveDraft}
                    disabled={!editable || busy || loading}
                    sx={{ textTransform: "none" }}
                >
                    {busy ? "Сохранение..." : "Сохранить черновик"}
                </Button>

                <Button
                    variant="contained"
                    color="success"
                    startIcon={<SendOutlinedIcon />}
                    onClick={handleSubmit}
                    disabled={!editable || busy || loading}
                    sx={{ textTransform: "none" }}
                >
                    Отправить отчёт
                </Button>
            </DialogActions>
        </Dialog>
    );
}
