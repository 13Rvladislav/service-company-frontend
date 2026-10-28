import { useCallback, useEffect, useState } from "react";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    Paper,
    Stack,
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

function formatDate(value) {
    if (!value) {
        return "Не указано";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Не указано";
    }

    return new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function ReportField({ label, value }) {
    if (!value || !String(value).trim()) {
        return null;
    }

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

export default function WorkReportViewer({
    requestId,
    requestStatus,
}) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [downloadError, setDownloadError] = useState("");

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

    const handleDownloadPdf = async () => {
        if (!requestId) {
            setDownloadError("Не указан идентификатор заявки.");
            return;
        }

        setDownloadingPdf(true);
        setDownloadError("");

        let objectUrl;

        try {
            const { blob, filename } = await downloadWorkReportPdf(requestId);
            objectUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = filename || `request-report-${requestId}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setDownloadError(getErrorMessage(err));
        } finally {
            if (objectUrl) {
                window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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

    if (loading) {
        return (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
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
                    alignItems={{ xs: "flex-start", sm: "center" }}
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
                        alignItems={{ xs: "stretch", sm: "center" }}
                    >
                        {report && report.status !== "DRAFT" && (
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={
                                    downloadingPdf ? (
                                        <CircularProgress size={14} />
                                    ) : (
                                        <DownloadOutlinedIcon sx={{ fontSize: 17 }} />
                                    )
                                }
                                onClick={handleDownloadPdf}
                                disabled={downloadingPdf}
                                sx={{
                                    px: 1.5,
                                    py: 0.75,
                                    minWidth: 0,
                                    borderColor: "#D0D5DD",
                                    color: "primary.main",
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    textTransform: "none",
                                    boxShadow: "none",
                                    whiteSpace: "nowrap",
                                    "& .MuiButton-startIcon": {
                                        mr: 0.75,
                                    },
                                    "&:hover": {
                                        backgroundColor: "#F9FAFB",
                                        borderColor: "#98A2B3",
                                        boxShadow: "none",
                                    },
                                    "&.Mui-disabled": {
                                        borderColor: "#E4E7EC",
                                        color: "#98A2B3",
                                    },
                                }}
                            >
                                {downloadingPdf ? "Формирование PDF..." : "Скачать PDF"}
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
                                ? ` · Отправлен ${formatDate(report.submittedAt)}`
                                : ""}
                        </Alert>

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
                                    {report.attachments.map((attachment) => (
                                        <Paper
                                            key={attachment.id}
                                            variant="outlined"
                                            sx={{ p: 1.5, borderRadius: 2 }}
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

                                                    <Box sx={{ minWidth: 0 }}>
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
                                                            {attachment.sizeBytes != null
                                                                ? `${(
                                                                    attachment.sizeBytes /
                                                                    1024
                                                                ).toFixed(1)} КБ`
                                                                : ""}
                                                            {attachment.uploadedAt
                                                                ? ` · ${formatDate(attachment.uploadedAt)}`
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
                                                        downloadingId !== null
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
                                    ))}
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
        </Paper>
    );
}