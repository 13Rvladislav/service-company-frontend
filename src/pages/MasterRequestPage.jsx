import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    MenuItem,
    Step,
    StepLabel,
    Stepper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";

import {
    getMasterRequests,
    getRequestById,
    acceptMasterRequest,
    rejectMasterRequest,
} from "../api/requestApi";

const WORKFLOW = [
    { status: "NEW", label: "Создана" },
    { status: "WAITING_FOR_ASSIGNMENT", label: "Назначение" },
    { status: "ASSIGNED", label: "Мастер назначен" },
    { status: "ACCEPTED", label: "Принята" },
    { status: "IN_PROGRESS", label: "В работе" },
    { status: "REPORT_SUBMITTED", label: "Отчёт" },
    { status: "COMPLETED", label: "Завершена" },
];

const STATUS_INFO = {
    NEW: {
        label: "Новая",
        color: "info",
        description: "Заявка создана.",
    },
    WAITING_FOR_ASSIGNMENT: {
        label: "Ожидает назначения",
        color: "warning",
        description: "Заявка ожидает назначения мастера.",
    },
    ASSIGNED: {
        label: "Ожидает вашего решения",
        color: "primary",
        description: "Заявка назначена вам. Примите её или отклоните.",
    },
    ACCEPTED: {
        label: "Принята мастером",
        color: "success",
        description: "Вы приняли заявку.",
    },
    IN_PROGRESS: {
        label: "В работе",
        color: "warning",
        description: "Работы по заявке выполняются.",
    },
    REPORT_SUBMITTED: {
        label: "Отчёт отправлен",
        color: "info",
        description: "Отчёт по заявке отправлен.",
    },
    REVISION_REQUIRED: {
        label: "Требуется доработка",
        color: "warning",
        description: "По заявке требуется дополнительная работа.",
    },
    COMPLETED: {
        label: "Завершена",
        color: "success",
        description: "Заявка завершена.",
    },
    REJECTED: {
        label: "Отклонена",
        color: "error",
        description: "Заявка отклонена.",
    },
    CANCELLED: {
        label: "Отменена",
        color: "default",
        description: "Заявка отменена.",
    },
};

const FILTERS = [
    { value: "ALL", label: "Все заявки" },
    { value: "ASSIGNED", label: "Ожидают моего решения" },
    { value: "ACCEPTED", label: "Принятые" },
    { value: "IN_PROGRESS", label: "В работе" },
    { value: "REPORT_SUBMITTED", label: "Отчёт отправлен" },
    { value: "REVISION_REQUIRED", label: "Требуют доработки" },
    { value: "COMPLETED", label: "Завершённые" },
    { value: "CANCELLED", label: "Отменённые" },
    { value: "REJECTED", label: "Отклонённые" },
];

function statusInfo(status) {
    return STATUS_INFO[status] || {
        label: status || "Неизвестен",
        color: "default",
        description: "Описание статуса отсутствует.",
    };
}

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

function workflowIndex(status) {
    if (status === "REVISION_REQUIRED") {
        return 5;
    }

    if (status === "CANCELLED" || status === "REJECTED") {
        return -1;
    }

    return WORKFLOW.findIndex((step) => step.status === status);
}

function RequestWorkflow({ status, compact = false }) {
    const info = statusInfo(status);

    if (status === "CANCELLED" || status === "REJECTED") {
        return (
            <Alert severity={status === "REJECTED" ? "error" : "info"}>
                {info.description}
            </Alert>
        );
    }

    return (
        <Box sx={{ overflowX: "auto", py: 1 }}>
            <Stepper
                activeStep={Math.max(workflowIndex(status), 0)}
                alternativeLabel
                sx={{
                    minWidth: compact ? 520 : 600,
                    "& .MuiStepLabel-label": {
                        fontSize: compact ? 10 : 12,
                    },
                }}
            >
                {WORKFLOW.map((step) => (
                    <Step key={step.status}>
                        <StepLabel>{step.label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
            >
                {info.description}
            </Typography>
        </Box>
    );
}

function getPersonName(person, fallback = "Не указан") {
    if (!person) {
        return fallback;
    }

    if (typeof person === "string" || typeof person === "number") {
        return String(person);
    }

    const name = [
        person.lastName,
        person.firstName,
        person.middleName,
    ]
        .filter(Boolean)
        .join(" ");

    return name || person.name || fallback;
}

function getReadableAddress(request) {
    const address = request?.address;

    // Номер квартиры берём из данных заявки.
    const apartmentValue =
        address && typeof address === "object"
            ? address.apartment ?? request?.apartment
            : request?.apartment;

    const apartment =
        apartmentValue != null && String(apartmentValue).trim()
            ? `кв. ${String(apartmentValue).trim()}`
            : null;

    if (address && typeof address === "object") {
        const parts = [
            address.cityName || address.city?.name || address.city,
            address.streetName || address.street?.name || address.street,
            address.houseNumber ||
            address.house?.number ||
            address.house?.houseNumber,
            apartment,
        ].filter((part) => part && typeof part !== "object");

        if (parts.length) {
            return parts.join(", ");
        }
    }

    if (typeof address === "string" && address.trim()) {
        return [address.trim(), apartment]
            .filter(Boolean)
            .join(", ");
    }

    const fallback = request?.addressId
        ? `ID адреса: ${request.addressId}`
        : "Адрес не предоставлен backend";

    return [fallback, apartment]
        .filter(Boolean)
        .join(", ");
}

function getReadableEquipment(request) {
    const equipment = request?.equipment;

    if (!equipment || typeof equipment !== "object") {
        return request?.equipmentId
            ? `ID оборудования: ${request.equipmentId}`
            : "Оборудование не предоставлено backend";
    }

    return [
        equipment.equipmentTypeName ||
        equipment.typeName ||
        equipment.equipmentType?.name ||
        equipment.type?.name,
        equipment.model,
        equipment.serialNumber
            ? `№ ${equipment.serialNumber}`
            : null,
    ]
        .filter(Boolean)
        .join(" ") || "Оборудование не предоставлено backend";
}

function getErrorMessage(error) {
    const status = error?.status;

    if (status === 400) {
        return error?.message ||
            "Действие невозможно для текущего статуса заявки.";
    }

    if (status === 401) {
        return "Сессия истекла. Войдите в систему повторно.";
    }

    if (status === 403) {
        return "У вас недостаточно прав для выполнения этого действия.";
    }

    if (status === 404) {
        return "Заявка не найдена. Обновите список заявок.";
    }

    if (status === 409) {
        return "Статус заявки изменился. Обновите карточку и попробуйте снова.";
    }

    if (error?.isNetworkError) {
        return "Не удалось связаться с сервером. Проверьте подключение.";
    }

    return error?.message ||
        "Не удалось выполнить действие. Попробуйте ещё раз.";
}

function RequestDetailsDialog({
    request,
    loading,
    error,
    busy,
    onClose,
    onRetry,
    onAccept,
    onReject,
}) {
    if (!request) {
        return null;
    }

    const info = statusInfo(request.status);

    const canRespond = request.status === "ASSIGNED";

    const client =
        request.client ||
        request.clientInfo || {
            lastName: request.clientLastName,
            firstName: request.clientFirstName,
            middleName: request.clientMiddleName,
        };

    const master = request.master || (
        request.masterName
            ? { name: request.masterName }
            : null
    );

    return (
        <Dialog
            open
            onClose={() => !busy && onClose()}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                >
                    <Box>
                        <Typography
                            variant="h5"
                            fontWeight={800}
                            sx={{ letterSpacing: "-0.02em" }}
                        >
                            Карточка заявки
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            №{" "}
                            {String(
                                request.requestNumber ??
                                request.number ??
                                request.id
                            )}
                        </Typography>
                    </Box>

                    <Chip
                        label={info.label}
                        color={info.color}
                        size="small"
                    />
                </Stack>
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    px: { xs: 2, sm: 3 },
                    py: 3,
                    bgcolor: "grey.50",
                }}
            >
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            py: 7,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert
                        severity="error"
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={onRetry}
                            >
                                Повторить
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                ) : (
                    <Stack spacing={2.5}>
                        <Box
                            sx={{
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2.5,
                                p: { xs: 1.75, sm: 2.5 },
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                fontWeight={800}
                                mb={2}
                            >
                                Информация о заявке
                            </Typography>

                            <Grid container spacing={2.25}>
                                {[
                                    [
                                        "Клиент",
                                        getPersonName(
                                            client,
                                            "ФИО не указано"
                                        ),
                                    ],
                                    [
                                        "Дата создания",
                                        formatDate(request.createdAt),
                                    ],
                                    [
                                        "Желаемое время визита",
                                        request.preferredVisitAt
                                            ? formatDate(request.preferredVisitAt)
                                            : "Не указано",
                                    ],
                                    [
                                        "Адрес",
                                        getReadableAddress(request),
                                    ],
                                    [
                                        "Оборудование",
                                        getReadableEquipment(request),
                                    ],
                                    [
                                        "Мастер",
                                        master
                                            ? getPersonName(master)
                                            : request.masterId
                                                ? `ID мастера: ${request.masterId}`
                                                : "Мастер не назначен",
                                    ],
                                ].map(([label, value]) => (
                                    <Grid
                                        item
                                        xs={12}
                                        sm={6}
                                        key={label}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            fontWeight={700}
                                            sx={{
                                                display: "block",
                                                mb: 0.5,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.04em",
                                            }}
                                        >
                                            {label}
                                        </Typography>

                                        <Typography
                                            variant="body1"
                                            fontWeight={
                                                label === "Клиент" ? 700 : 500
                                            }
                                            sx={{
                                                overflowWrap: "anywhere",
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {value || "Не указано"}
                                        </Typography>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        <Box
                            sx={{
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2.5,
                                p: { xs: 1.75, sm: 2.5 },
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                fontWeight={800}
                                mb={1}
                            >
                                Описание проблемы
                            </Typography>

                            <Typography
                                color={
                                    request.problemDescription
                                        ? "text.primary"
                                        : "text.secondary"
                                }
                                sx={{
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                    lineHeight: 1.7,
                                }}
                            >
                                {request.problemDescription ||
                                    "Описание отсутствует"}
                            </Typography>
                        </Box>

                        {request.clientComment && (
                            <Box
                                sx={{
                                    bgcolor: "background.paper",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 2.5,
                                    p: { xs: 1.75, sm: 2.5 },
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={800}
                                    mb={1}
                                >
                                    Комментарий клиента
                                </Typography>

                                <Typography
                                    sx={{
                                        whiteSpace: "pre-wrap",
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {request.clientComment}
                                </Typography>
                            </Box>
                        )}

                        <Box
                            sx={{
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2.5,
                                p: { xs: 1.5, sm: 2.5 },
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                fontWeight={800}
                                mb={2}
                            >
                                Этапы заявки
                            </Typography>

                            <RequestWorkflow status={request.status} />
                        </Box>

                        {canRespond ? (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Заявка назначена вам. После принятия её статус
                                изменится на «В работе». Если отклонить заявку,
                                она вернётся на этап назначения диспетчером
                                или администратором.
                            </Alert>
                        ) : (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Для текущего статуса заявки действия принятия
                                и отклонения недоступны.
                            </Alert>
                        )}
                    </Stack>
                )}
            </DialogContent>

            {!loading && !error && (
                <DialogActions
                    sx={{
                        p: 2,
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                    }}
                >
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                    >
                        {canRespond && (
                            <>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={
                                        busy
                                            ? <CircularProgress
                                                size={18}
                                                color="inherit"
                                            />
                                            : <CheckCircleIcon />
                                    }
                                    onClick={onAccept}
                                    disabled={busy}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontWeight: 700,
                                        boxShadow: "none",
                                    }}
                                >
                                    {busy
                                        ? "Обработка..."
                                        : "Принять заявку"}
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CancelOutlinedIcon />}
                                    onClick={onReject}
                                    disabled={busy}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: "none",
                                        fontWeight: 700,
                                    }}
                                >
                                    Отклонить заявку
                                </Button>
                            </>
                        )}
                    </Stack>

                    <Button
                        onClick={onClose}
                        disabled={busy}
                        sx={{ textTransform: "none" }}
                    >
                        Закрыть
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
}

export default function MasterRequestPage() {
    const [user, setUser] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [details, setDetails] = useState(null);

    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");

    const [actionLoading, setActionLoading] = useState(false);
    const [confirmation, setConfirmation] = useState(null);

    const isMaster = user?.role === "ENGINEER";

    const loadRequests = useCallback(async (isRefresh = false) => {
        setError("");

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const data = await getMasterRequests();

            if (!Array.isArray(data)) {
                throw new Error("Сервер вернул некорректный список заявок.");
            }

            setRequests(data);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadProfile = useCallback(async () => {
        setProfileLoading(true);

        try {
            const profile = await getCurrentProfile();
            setUser(profile);
            return profile;
        } catch {
            setUser(null);
            setError(
                "Не удалось определить пользователя. Войдите в систему повторно."
            );
            return null;
        } finally {
            setProfileLoading(false);
        }
    }, []);

    useEffect(() => {
        let active = true;

        async function init() {
            const profile = await loadProfile();

            if (!active) {
                return;
            }

            if (!profile || profile.role !== "ENGINEER") {
                setLoading(false);
                return;
            }

            await loadRequests();
        }

        init();

        return () => {
            active = false;
        };
    }, [loadProfile, loadRequests]);

    const filteredRequests = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return [...requests]
            .filter((request) => {
                if (
                    filter !== "ALL" &&
                    request.status !== filter
                ) {
                    return false;
                }

                if (!normalizedSearch) {
                    return true;
                }

                const id = String(
                    request.id ?? ""
                ).toLowerCase();

                return id.includes(normalizedSearch);
            })
            .sort((a, b) => {
                // В первую очередь показываем заявки,
                // ожидающие решения мастера.
                const aPriority = a.status === "ASSIGNED" ? 0 : 1;
                const bPriority = b.status === "ASSIGNED" ? 0 : 1;

                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }

                return (
                    new Date(b.createdAt || 0) -
                    new Date(a.createdAt || 0)
                );
            });
    }, [requests, search, filter]);

    const stats = useMemo(() => ({
        total: requests.length,

        assigned: requests.filter(
            (request) => request.status === "ASSIGNED"
        ).length,

        inProgress: requests.filter(
            (request) => request.status === "IN_PROGRESS"
        ).length,

        completed: requests.filter(
            (request) => request.status === "COMPLETED"
        ).length,
    }), [requests]);

    const openRequest = async (request) => {
        setSelectedRequest(request);
        setDetails(null);
        setDetailsError("");
        setDetailsLoading(true);
        setError("");
        setSuccess("");

        try {
            const data = await getRequestById(request.id);

            if (!data || typeof data !== "object") {
                throw new Error(
                    "Не удалось получить подробности заявки."
                );
            }

            setDetails(data);

            setSelectedRequest((previous) =>
                previous?.id === request.id
                    ? { ...previous, ...data }
                    : previous
            );
        } catch (requestError) {
            setDetailsError(getErrorMessage(requestError));
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeRequestDetails = () => {
        if (actionLoading) {
            return;
        }

        setSelectedRequest(null);
        setDetails(null);
        setDetailsError("");
        setConfirmation(null);
    };

    const refreshDetails = async () => {
        if (!selectedRequest?.id) {
            return;
        }

        await openRequest(selectedRequest);
    };

    const handleAccept = () => {
        if (!details || details.status !== "ASSIGNED") {
            return;
        }

        setConfirmation({
            type: "accept",
            request: details,
        });
    };

    const handleReject = () => {
        if (!details || details.status !== "ASSIGNED") {
            return;
        }

        setConfirmation({
            type: "reject",
            request: details,
        });
    };


    const handleConfirmAction = async () => {
        const target = confirmation?.request;
        const action = confirmation?.type;

        if (
            !target?.id ||
            !["accept", "reject"].includes(action) ||
            target.status !== "ASSIGNED"
        ) {
            return;
        }

        setActionLoading(true);
        setError("");
        setSuccess("");

        try {
            if (action === "accept") {
                await acceptMasterRequest(target.id);
            } else {
                await rejectMasterRequest(target.id);
            }

            // Закрываем подтверждение и карточку заявки.
            setConfirmation(null);
            setSelectedRequest(null);
            setDetails(null);
            setDetailsError("");

            // Обновляем список и статистику актуальными данными backend.
            await loadRequests(true);

            setSuccess(
                action === "accept"
                    ? `Заявка №${String(target.id)} принята. Статус изменён на «В работе».`
                    : `Заявка №${String(target.id)} отклонена и возвращена на этап назначения.`
            );
        } catch (requestError) {
            setConfirmation(null);
            setError(getErrorMessage(requestError));
        } finally {
            setActionLoading(false);
        }
    };


    if (profileLoading || (loading && !user && !error)) {
        return (
            <MainLayout user={user}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 10,
                    }}
                >
                    <CircularProgress />
                </Box>
            </MainLayout>
        );
    }

    if (!user || !isMaster) {
        return (
            <MainLayout user={user}>
                <Box
                    sx={{
                        maxWidth: 720,
                        mx: "auto",
                        mt: 4,
                    }}
                >
                    <Alert severity="error">
                        {error ||
                            "У вас нет доступа к заявкам мастера. Эта страница доступна только мастеру."}
                    </Alert>
                </Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout user={user}>
            <Box sx={{ maxWidth: 1440, mx: "auto" }}>
                {/* Заголовок */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: {
                            xs: "flex-start",
                            sm: "center",
                        },
                        flexDirection: {
                            xs: "column",
                            sm: "row",
                        },
                        gap: 2,
                        mb: 3,
                        width: "100%",
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            color="primary"
                        >
                            Мои заявки
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                        >
                            Просмотр заявок, принятие в работу и отклонение
                            назначенных заявок.
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={
                            refreshing
                                ? <CircularProgress size={16} />
                                : <RefreshIcon />
                        }
                        onClick={() => loadRequests(true)}
                        disabled={loading || refreshing}
                        size="small"
                        sx={{
                            height: 40,
                            px: 1.8,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            boxShadow: "none",
                        }}
                    >
                        {refreshing ? "Обновление..." : "Обновить"}
                    </Button>
                </Box>

                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        onClose={() => setError("")}
                    >
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert
                        severity="success"
                        sx={{ mb: 2 }}
                        onClose={() => setSuccess("")}
                    >
                        {success}
                    </Alert>
                )}

                {/* Статистика */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        {
                            label: "Всего заявок",
                            value: stats.total,
                            color: "#2563EB",
                        },
                        {
                            label: "Ожидают моего решения",
                            value: stats.assigned,
                            color: "#D97706",
                        },
                        {
                            label: "В работе",
                            value: stats.inProgress,
                            color: "#16A34A",
                        },
                        {
                            label: "Завершённые",
                            value: stats.completed,
                            color: "#64748B",
                        },
                    ].map((item) => (
                        <Grid
                            key={item.label}
                            size={{ xs: 12, sm: 6, lg: 3 }}
                        >
                            <Card
                                sx={{
                                    borderRadius: 3,
                                    height: "100%",
                                }}
                            >
                                <CardContent>
                                    <Typography
                                        color="text.secondary"
                                        variant="body2"
                                    >
                                        {item.label}
                                    </Typography>

                                    <Typography
                                        variant="h3"
                                        fontWeight={800}
                                        sx={{
                                            mt: 1,
                                            color: item.color,
                                        }}
                                    >
                                        {item.value}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Поиск и фильтры */}
                <Card sx={{ borderRadius: 3, mb: 3 }}>
                    <CardContent>
                        <Grid
                            container
                            spacing={2}
                            alignItems="center"
                        >
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                >
                                    Список заявок
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Откройте карточку, чтобы посмотреть
                                    информацию и принять решение по заявке.
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 5 }}>
                                <Stack spacing={1.5}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Поиск по ID заявки"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                    />

                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        label="Фильтр по статусу"
                                        value={filter}
                                        onChange={(event) =>
                                            setFilter(event.target.value)
                                        }
                                    >
                                        {FILTERS.map((option) => (
                                            <MenuItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Список заявок */}
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            py: 8,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : filteredRequests.length === 0 ? (
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent
                            sx={{
                                textAlign: "center",
                                py: 8,
                            }}
                        >
                            <AssignmentOutlinedIcon
                                sx={{
                                    fontSize: 54,
                                    color: "text.disabled",
                                    mb: 1,
                                }}
                            />

                            <Typography
                                variant="h6"
                                fontWeight={700}
                            >
                                {requests.length === 0
                                    ? "Заявок пока нет"
                                    : "Заявки не найдены"}
                            </Typography>

                            <Typography
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                {requests.length === 0
                                    ? "Назначенные вам заявки появятся здесь."
                                    : "Измените поисковый запрос или фильтр."}
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <Stack spacing={2}>
                        {filteredRequests.map((request) => {
                            const info = statusInfo(request.status);
                            const canRespond =
                                request.status === "ASSIGNED";

                            return (
                                <Card
                                    key={request.id}
                                    onClick={() => openRequest(request)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" ||
                                            event.key === " "
                                        ) {
                                            event.preventDefault();
                                            openRequest(request);
                                        }
                                    }}
                                    sx={{
                                        borderRadius: 3,
                                        cursor: "pointer",
                                        transition:
                                            "box-shadow .2s, transform .2s",
                                        borderLeft: canRespond
                                            ? "4px solid #2563EB"
                                            : "4px solid transparent",
                                        "&:hover": {
                                            boxShadow: 5,
                                            transform: "translateY(-1px)",
                                        },
                                        "&:focus-visible": {
                                            outline: "2px solid",
                                            outlineColor: "primary.main",
                                            outlineOffset: 2,
                                        },
                                    }}
                                >
                                    <CardContent
                                        sx={{
                                            p: {
                                                xs: 2,
                                                md: 3,
                                            },
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
                                            spacing={2}
                                        >
                                            <Stack
                                                spacing={1.25}
                                                sx={{
                                                    minWidth: 0,
                                                    flex: 1,
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    flexWrap="wrap"
                                                >
                                                    <Typography
                                                        fontWeight={800}
                                                        sx={{
                                                            overflowWrap:
                                                                "anywhere",
                                                        }}
                                                    >
                                                        Заявка №{" "}
                                                        {String(
                                                            request.requestNumber ??
                                                            request.number ??
                                                            request.id
                                                        )}
                                                    </Typography>

                                                    <Chip
                                                        label={info.label}
                                                        color={info.color}
                                                        size="small"
                                                    />

                                                    {canRespond && (
                                                        <Chip
                                                            label="Требуется решение"
                                                            color="primary"
                                                            variant="outlined"
                                                            size="small"
                                                        />
                                                    )}
                                                </Stack>

                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                >
                                                    <AccessTimeIcon
                                                        fontSize="small"
                                                        color="action"
                                                    />

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        Создана:{" "}
                                                        {formatDate(
                                                            request.createdAt
                                                        )}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </Stack>

                                        <Divider sx={{ my: 2 }} />

                                        <Stack
                                            direction={{
                                                xs: "column",
                                                md: "row",
                                            }}
                                            alignItems="stretch"
                                            spacing={2}
                                        >
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    borderRadius: 2,
                                                    backgroundColor:
                                                        "background.default",
                                                    p: {
                                                        xs: 1.25,
                                                        md: 1.5,
                                                    },
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <RequestWorkflow
                                                    status={request.status}
                                                    compact
                                                />
                                            </Box>

                                            <Box
                                                sx={{
                                                    minWidth: {
                                                        xs: "auto",
                                                        md: 180,
                                                    },
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    px: {
                                                        xs: 0,
                                                        md: 1,
                                                    },
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    color="primary.main"
                                                    fontWeight={600}
                                                    sx={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Открыть карточку
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}

                {/* Карточка заявки */}
                <RequestDetailsDialog
                    request={details}
                    loading={detailsLoading}
                    error={detailsError}
                    busy={actionLoading}
                    onClose={closeRequestDetails}
                    onRetry={refreshDetails}
                    onAccept={handleAccept}
                    onReject={handleReject}
                />

                {/* Подтверждение принятия или отклонения */}
                <Dialog
                    open={Boolean(confirmation)}
                    onClose={() =>
                        !actionLoading && setConfirmation(null)
                    }
                    maxWidth="xs"
                    fullWidth
                >
                    <DialogTitle fontWeight={800}>
                        {confirmation?.type === "accept"
                            ? "Принять заявку?"
                            : "Отклонить заявку?"}
                    </DialogTitle>

                    <DialogContent dividers>
                        <Typography color="text.secondary">
                            {confirmation?.type === "accept"
                                ? `После принятия заявки №${String(
                                    confirmation?.request?.id ?? ""
                                )} её статус изменится на «В работе».`
                                : `Заявка №${String(
                                    confirmation?.request?.id ?? ""
                                )} будет возвращена на этап назначения мастера.`}
                        </Typography>
                    </DialogContent>

                    <DialogActions sx={{ p: 2, gap: 1 }}>
                        <Button
                            onClick={() => setConfirmation(null)}
                            disabled={actionLoading}
                            sx={{ textTransform: "none" }}
                        >
                            Отмена
                        </Button>

                        <Button
                            variant="contained"
                            color={
                                confirmation?.type === "accept"
                                    ? "success"
                                    : "error"
                            }
                            onClick={handleConfirmAction}
                            disabled={actionLoading}
                            startIcon={
                                actionLoading
                                    ? <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                    : confirmation?.type === "accept"
                                        ? <CheckCircleIcon />
                                        : <CancelOutlinedIcon />
                            }
                        >
                            {actionLoading
                                ? "Обработка..."
                                : confirmation?.type === "accept"
                                    ? "Да, принять"
                                    : "Да, отклонить"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
}