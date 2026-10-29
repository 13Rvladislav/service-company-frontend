
import { useCallback, useEffect, useState } from "react";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/Refresh";

import {
    getWorkReport,
    downloadWorkReportAttachment,
} from "../../api/requestApi";
import { downloadWorkReportPdf } from "../../api/reportPdfApi";
import { getCurrentProfile } from "../../api/userApi";

function formatDate(value) {
    if (!value) return "Не указано";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Не указано";

    return new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function ReportField({ label, value }) {
    if (!value || !String(value).trim()) return null;

    return (
        <Box>
            <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={600}
                sx={{ mb: 0.5 }}
            >
                {label}
            </Typography>

            <Typography
                sx={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    lineHeight: 1.7,
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}

function getErrorMessage(error) {
    if (error?.status === 403) {
        return "Просмотр отчёта пока недоступен. Возможно, мастер ещё не отправил его клиенту.";
    }

    if (error?.status === 404) {
        return "Отчёт или заявка не найдены.";
    }

    if (error?.isNetworkError) {
        return "Не удалось подключиться к серверу.";
    }

    return error?.message || "Не удалось загрузить отчёт.";
}

const REPORT_API_BASE =
    import.meta.env.VITE_API_URL || "http://localhost:8084/api";

async function postReportDecision(url, body) {
    const response = await fetch(`${REPORT_API_BASE}${url}`, {
        method: "POST",
        credentials: "include",
        headers: body
            ? { "Content-Type": "application/json" }
            : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        let message = `Ошибка запроса (${response.status})`;

        try {
            const data = await response.json();
            message = data.message || data.detail || message;
        } catch {
            // Сервер мог вернуть пустой или не JSON-ответ.
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";

    return contentType.includes("application/json")
        ? response.json()
        : null;
}

export default function WorkReportViewer({
    requestId,
    requestStatus,
    onDecision,
    userRole: suppliedUserRole,
}) {
    const [report, setReport] = useState(null);
    const [resolvedUserRole, setResolvedUserRole] = useState(
        String(suppliedUserRole || "").toUpperCase()
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [downloadError, setDownloadError] = useState("");

    const [decisionBusy, setDecisionBusy] = useState(false);
    const [decisionError, setDecisionError] = useState("");
    const [decisionSuccess, setDecisionSuccess] = useState("");

    const [reworkDialogOpen, setReworkDialogOpen] = useState(false);
    const [reworkReason, setReworkReason] = useState("");

    const loadReport = useCallback(async () => {
        if (!requestId) {
            setError("Не указан идентификатор заявки.");
            setReport(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        setReport(null);

        try {
            const result = await getWorkReport(requestId);

            if (!result?.exists || !result?.report) {
                setReport(null);
                return;
            }

            setReport(result.report);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [requestId]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    useEffect(() => {
        if (suppliedUserRole) {
            setResolvedUserRole(
                String(suppliedUserRole).toUpperCase()
            );
            return;
        }

        let cancelled = false;

        getCurrentProfile()
            .then((profile) => {
                if (!cancelled) {
                    setResolvedUserRole(
                        String(profile?.role || "").toUpperCase()
                    );
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setResolvedUserRole("");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [suppliedUserRole]);

    // Только клиент может принять выполненную работу
    // или вернуть отчёт мастеру на доработку.
    const canClientDecide = resolvedUserRole === "CLIENT";

    const handleDownloadPdf = async () => {
        if (!requestId) {
            setDownloadError("Не указан идентификатор заявки.");
            return;
        }

        setDownloadingPdf(true);
        setDownloadError("");

        let objectUrl;

        try {
            const { blob, filename } =
                await downloadWorkReportPdf(requestId);

            objectUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = objectUrl;
            link.download =
                filename || `request-report-${requestId}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setDownloadError(getErrorMessage(err));
        } finally {
            if (objectUrl) {
                window.setTimeout(
                    () => URL.revokeObjectURL(objectUrl),
                    1000
                );
            }

            setDownloadingPdf(false);
        }
    };

    const handleDownload = async (attachment) => {
        if (!attachment?.id) {
            setDownloadError("У вложения отсутствует идентификатор.");
            return;
        }

        setDownloadingId(attachment.id);
        setDownloadError("");

        let objectUrl;

        try {
            const { blob, filename } =
                await downloadWorkReportAttachment(
                    requestId,
                    attachment.id
                );

            objectUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = objectUrl;
            link.download =
                filename ||
                attachment.originalFileName ||
                `attachment-${attachment.id}`;

            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setDownloadError(getErrorMessage(err));
        } finally {
            if (objectUrl) {
                window.setTimeout(
                    () => URL.revokeObjectURL(objectUrl),
                    1000
                );
            }

            setDownloadingId(null);
        }
    };

    const handleAcceptWork = async () => {
        if (!canClientDecide || decisionBusy) return;

        setDecisionBusy(true);
        setDecisionError("");
        setDecisionSuccess("");

        try {
            await postReportDecision(
                `/requests/${requestId}/report/accept`
            );

            setDecisionSuccess("Работа принята. Заявка завершена.");

            await loadReport();
            await onDecision?.("COMPLETED");
        } catch (err) {
            setDecisionError(
                err.message || "Не удалось принять работу."
            );
        } finally {
            setDecisionBusy(false);
        }
    };

    const handleRequestRework = async () => {
        if (!canClientDecide || decisionBusy) return;

        const reason = reworkReason.trim();

        if (!reason) {
            setDecisionError(
                "Укажите причину возврата отчёта на доработку."
            );
            return;
        }

        if (reason.length > 5000) {
            setDecisionError(
                "Причина не должна превышать 5000 символов."
            );
            return;
        }

        setDecisionBusy(true);
        setDecisionError("");
        setDecisionSuccess("");

        try {
            await postReportDecision(
                `/requests/${requestId}/report/rework`,
                { reason }
            );

            setReworkDialogOpen(false);
            setReworkReason("");

            setDecisionSuccess(
                "Отчёт возвращён мастеру на доработку."
            );

            await loadReport();
            await onDecision?.("REVISION_REQUIRED");
        } catch (err) {
            setDecisionError(
                err.message ||
                    "Не удалось вернуть отчёт на доработку."
            );
        } finally {
            setDecisionBusy(false);
        }
    };

    if (loading) {
        return (
            <Paper
                variant="outlined"
                sx={{ p: 3, borderRadius: 2 }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                >
                    <CircularProgress size={24} />
                    <Typography>
                        Загружаем отчёт о выполненных работах...
                    </Typography>
                </Stack>
            </Paper>
        );
    }

    return (
        <Paper
            variant="outlined"
            sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                bgcolor: "background.paper",
            }}
        >
            <Stack spacing={2.5}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{
                        xs: "flex-start",
                        sm: "center",
                    }}
                    spacing={1}
                >
                    <Box>
                        <Typography variant="h6" fontWeight={800}>
                            Отчёт о выполненных работах
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Заявка № {requestId}
                        </Typography>
                    </Box>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{
                            xs: "stretch",
                            sm: "center",
                        }}
                    >
                        {report && report.status !== "DRAFT" && (
                            <Button
                                variant="contained"
                                startIcon={
                                    downloadingPdf ? (
                                        <CircularProgress
                                            size={16}
                                            color="inherit"
                                        />
                                    ) : (
                                        <DownloadOutlinedIcon />
                                    )
                                }
                                onClick={handleDownloadPdf}
                                disabled={downloadingPdf}
                            >
                                {downloadingPdf
                                    ? "Формирование PDF..."
                                    : "Скачать PDF-отчёт"}
                            </Button>
                        )}

                        <Button
                            startIcon={<RefreshOutlinedIcon />}
                            onClick={loadReport}
                            disabled={loading}
                        >
                            Обновить
                        </Button>
                    </Stack>
                </Stack>

                {error && (
                    <Alert
                        severity="error"
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={loadReport}
                            >
                                Повторить
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {!error && !report && (
                    <Alert severity="info">
                        {requestStatus === "IN_PROGRESS"
                            ? "Мастер ещё выполняет работы. Отчёт появится после его отправки."
                            : "Для этой заявки пока нет доступного отчёта."}
                    </Alert>
                )}

                {report && (
                    <>
                        <Alert
                            severity={
                                report.status === "SUBMITTED"
                                    ? "success"
                                    : "info"
                            }
                        >
                            Отчёт: {report.status || "Статус не указан"}
                            {report.submittedAt
                                ? ` · Отправлен ${formatDate(
                                      report.submittedAt
                                  )}`
                                : ""}
                        </Alert>

                        {report.clientFeedback && (
                            <Alert severity="warning">
                                <Typography
                                    fontWeight={800}
                                    component="div"
                                >
                                    Замечание клиента
                                </Typography>

                                <Typography
                                    sx={{
                                        whiteSpace: "pre-wrap",
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {report.clientFeedback}
                                </Typography>
                            </Alert>
                        )}

                        {decisionError && (
                            <Alert
                                severity="error"
                                onClose={() => setDecisionError("")}
                            >
                                {decisionError}
                            </Alert>
                        )}

                        {decisionSuccess && (
                            <Alert
                                severity="success"
                                onClose={() => setDecisionSuccess("")}
                            >
                                {decisionSuccess}
                            </Alert>
                        )}

                        {canClientDecide &&
                            report.status === "SUBMITTED" &&
                            requestStatus === "REPORT_SUBMITTED" && (
                                <Stack
                                    direction={{
                                        xs: "column",
                                        sm: "row",
                                    }}
                                    spacing={1}
                                >
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={
                                            decisionBusy ? (
                                                <CircularProgress
                                                    size={18}
                                                    color="inherit"
                                                />
                                            ) : (
                                                <span aria-hidden="true">
                                                    ✓
                                                </span>
                                            )
                                        }
                                        disabled={decisionBusy}
                                        onClick={handleAcceptWork}
                                    >
                                        Принять работу
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="warning"
                                        startIcon={
                                            <span aria-hidden="true">
                                                ↻
                                            </span>
                                        }
                                        disabled={decisionBusy}
                                        onClick={() => {
                                            setDecisionError("");
                                            setReworkDialogOpen(true);
                                        }}
                                    >
                                        Вернуть на доработку
                                    </Button>
                                </Stack>
                            )}

                        <Divider />

                        <ReportField
                            label="Диагноз"
                            value={report.diagnosis}
                        />

                        <ReportField
                            label="Причина неисправности"
                            value={report.failureCause}
                        />

                        <ReportField
                            label="Выполненные работы"
                            value={report.performedWork}
                        />

                        <ReportField
                            label="Результат работ"
                            value={report.workResult}
                        />

                        <ReportField
                            label="Рекомендации"
                            value={report.recommendations}
                        />

                        <ReportField
                            label="Комментарий мастера"
                            value={report.masterComment}
                        />

                        <ReportField
                            label="Дата завершения работ"
                            value={formatDate(report.completedAt)}
                        />

                        <Divider />

                        <Box>
                            <Typography
                                variant="subtitle1"
                                fontWeight={800}
                                sx={{ mb: 1.5 }}
                            >
                                Вложения
                            </Typography>

                            {Array.isArray(report.attachments) &&
                            report.attachments.length > 0 ? (
                                <Stack spacing={1}>
                                    {report.attachments.map(
                                        (attachment) => (
                                            <Paper
                                                key={attachment.id}
                                                variant="outlined"
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <Stack
                                                    direction={{
                                                        xs: "column",
                                                        sm: "row",
                                                    }}
                                                    justifyContent="space-between"
                                                    alignItems={{
                                                        xs: "flex-start",
                                                        sm: "center",
                                                    }}
                                                    spacing={1}
                                                >
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="center"
                                                        sx={{ minWidth: 0 }}
                                                    >
                                                        <DescriptionOutlinedIcon />

                                                        <Box
                                                            sx={{
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <Typography
                                                                fontWeight={600}
                                                                sx={{
                                                                    overflowWrap:
                                                                        "anywhere",
                                                                }}
                                                            >
                                                                {attachment.originalFileName ||
                                                                    `Файл ${attachment.id}`}
                                                            </Typography>

                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {attachment.sizeBytes !=
                                                                null
                                                                    ? `${(
                                                                          attachment.sizeBytes /
                                                                          1024
                                                                      ).toFixed(
                                                                          1
                                                                      )} КБ`
                                                                    : ""}
                                                                {attachment.uploadedAt
                                                                    ? ` · ${formatDate(
                                                                          attachment.uploadedAt
                                                                      )}`
                                                                    : ""}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>

                                                    <Button
                                                        variant="outlined"
                                                        startIcon={
                                                            downloadingId ===
                                                            attachment.id ? (
                                                                <CircularProgress
                                                                    size={16}
                                                                />
                                                            ) : (
                                                                <DownloadOutlinedIcon />
                                                            )
                                                        }
                                                        disabled={
                                                            downloadingId !==
                                                            null
                                                        }
                                                        onClick={() =>
                                                            handleDownload(
                                                                attachment
                                                            )
                                                        }
                                                    >
                                                        Скачать
                                                    </Button>
                                                </Stack>
                                            </Paper>
                                        )
                                    )}
                                </Stack>
                            ) : (
                                <Typography color="text.secondary">
                                    Вложения к отчёту отсутствуют.
                                </Typography>
                            )}
                        </Box>

                        {downloadError && (
                            <Alert
                                severity="error"
                                onClose={() => setDownloadError("")}
                            >
                                {downloadError}
                            </Alert>
                        )}
                    </>
                )}
            </Stack>

            <Dialog
                open={reworkDialogOpen && canClientDecide}
                onClose={() =>
                    !decisionBusy && setReworkDialogOpen(false)
                }
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    Вернуть отчёт на доработку
                </DialogTitle>

                <DialogContent>
                    <Typography
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        Укажите, что необходимо исправить. Причина будет
                        доступна мастеру в карточке заявки.
                    </Typography>

                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        minRows={3}
                        maxRows={8}
                        label="Причина возврата"
                        value={reworkReason}
                        onChange={(event) =>
                            setReworkReason(event.target.value)
                        }
                        inputProps={{ maxLength: 5000 }}
                        helperText={`${reworkReason.length}/5000`}
                        disabled={decisionBusy}
                        error={
                            !reworkReason.trim() &&
                            Boolean(decisionError)
                        }
                    />
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setReworkDialogOpen(false)}
                        disabled={decisionBusy}
                    >
                        Отмена
                    </Button>

                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleRequestRework}
                        disabled={decisionBusy}
                        startIcon={
                            decisionBusy ? (
                                <CircularProgress
                                    size={18}
                                    color="inherit"
                                />
                            ) : (
                                <span aria-hidden="true">↻</span>
                            )
                        }
                    >
                        Подтвердить возврат
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
