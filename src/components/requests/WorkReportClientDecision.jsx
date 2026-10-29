
import { useState } from "react";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
} from "@mui/material";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReplayIcon from "@mui/icons-material/Replay";

import {
    acceptWorkReport,
    requestWorkReportRework,
} from "../../api/requestApi";

function getErrorMessage(error) {
    if (error?.status === 400) {
        return error.message ||
            "Действие невозможно для текущего статуса заявки.";
    }

    if (error?.status === 401) {
        return "Сессия истекла. Войдите в систему повторно.";
    }

    if (error?.status === 403) {
        return "У вас нет прав для выполнения этого действия.";
    }

    if (error?.status === 404) {
        return "Заявка или отчёт не найдены.";
    }

    if (error?.status === 409) {
        return "Статус заявки изменился. Обновите страницу.";
    }

    if (error?.isNetworkError) {
        return "Не удалось подключиться к серверу.";
    }

    return error?.message || "Не удалось выполнить действие.";
}

export default function WorkReportClientDecision({
    requestId,
    report,
    onDecision,
}) {
    const [reworkOpen, setReworkOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    if (!report || report.status !== "SUBMITTED") {
        return null;
    }

    async function handleAccept() {
        setBusy(true);
        setError("");
        setSuccess("");

        try {
            await acceptWorkReport(requestId);
            setSuccess("Работа принята. Заявка завершена.");
            await onDecision?.("COMPLETED");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setBusy(false);
        }
    }

    async function handleRework() {
        const trimmedReason = reason.trim();

        if (!trimmedReason) {
            setError("Укажите причину возврата на доработку.");
            return;
        }

        if (trimmedReason.length > 5000) {
            setError("Причина не должна превышать 5000 символов.");
            return;
        }

        setBusy(true);
        setError("");
        setSuccess("");

        try {
            await requestWorkReportRework(requestId, trimmedReason);
            setReworkOpen(false);
            setReason("");
            setSuccess(
                "Отчёт возвращён мастеру на доработку."
            );
            await onDecision?.("REVISION_REQUIRED");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
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
                    <Alert severity="success">
                        {success}
                    </Alert>
                )}

                {!success && (
                    <Alert severity="info">
                        Мастер отправил отчёт. Проверьте выполненные работы.
                        Если всё выполнено, примите работу. Если необходимы
                        исправления, верните отчёт мастеру с указанием причины.
                    </Alert>
                )}

                {!success && (
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                    >
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={
                                busy
                                    ? <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                    : <CheckCircleOutlineIcon />
                            }
                            onClick={handleAccept}
                            disabled={busy}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                            }}
                        >
                            {busy ? "Обработка..." : "Принять работу"}
                        </Button>

                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<ReplayIcon />}
                            onClick={() => {
                                setError("");
                                setReworkOpen(true);
                            }}
                            disabled={busy}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                            }}
                        >
                            Отправить на доработку
                        </Button>
                    </Stack>
                )}
            </Stack>

            <Dialog
                open={reworkOpen}
                onClose={() => !busy && setReworkOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    Возврат отчёта на доработку
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Alert severity="warning">
                            Укажите, что именно необходимо исправить.
                            Причина будет отображаться мастеру.
                        </Alert>

                        {error && (
                            <Alert
                                severity="error"
                                onClose={() => setError("")}
                            >
                                {error}
                            </Alert>
                        )}

                        <TextField
                            label="Причина доработки"
                            value={reason}
                            onChange={(event) => {
                                setReason(event.target.value);
                                setError("");
                            }}
                            multiline
                            minRows={4}
                            maxRows={8}
                            fullWidth
                            required
                            inputProps={{ maxLength: 5000 }}
                            helperText={`${reason.length}/5000`}
                            error={
                                Boolean(error) &&
                                !reason.trim()
                            }
                            disabled={busy}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setReworkOpen(false)}
                        disabled={busy}
                    >
                        Отмена
                    </Button>

                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleRework}
                        disabled={busy || !reason.trim()}
                        startIcon={
                            busy
                                ? <CircularProgress
                                    size={18}
                                    color="inherit"
                                />
                                : <ReplayIcon />
                        }
                    >
                        {busy ? "Отправка..." : "Вернуть мастеру"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
