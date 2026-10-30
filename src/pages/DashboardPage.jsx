
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Grid,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";

import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/Refresh";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";
import {
    getAllRequests,
    getMasterRequests,
    getMyRequests,
} from "../api/requestApi";

const COLORS = {
    text: "#172B4D",
    secondary: "#64748B",
    border: "#E8EDF4",
    background: "#F5F7FB",
    primary: "#2563EB",
};

const STATUS_INFO = {
    NEW: { label: "Новая", color: "info" },
    WAITING_FOR_ASSIGNMENT: {
        label: "Ожидает назначения",
        color: "warning",
    },
    ASSIGNED: { label: "Мастер назначен", color: "primary" },
    ACCEPTED: { label: "Принята мастером", color: "primary" },
    IN_PROGRESS: { label: "В работе", color: "warning" },
    REPORT_SUBMITTED: {
        label: "Отчёт на согласовании",
        color: "info",
    },
    REVISION_REQUIRED: {
        label: "Требуется доработка",
        color: "error",
    },
    COMPLETED: { label: "Завершена", color: "success" },
    CANCELLED: { label: "Отменена", color: "default" },
    CANCELED: { label: "Отменена", color: "default" },
};

const ACTIVE_STATUSES = new Set([
    "NEW",
    "WAITING_FOR_ASSIGNMENT",
    "ASSIGNED",
    "ACCEPTED",
    "IN_PROGRESS",
    "REPORT_SUBMITTED",
    "REVISION_REQUIRED",
]);

const ROLE_INFO = {
    CLIENT: {
        title: "Личный кабинет",
        subtitle: "Создавайте заявки и следите за ходом обслуживания.",
        listPath: "/my-requests",
        listLabel: "Мои заявки",
    },
    ENGINEER: {
        title: "Рабочая панель мастера",
        subtitle: "Контролируйте назначенные работы и отчёты.",
        listPath: "/master-requests",
        listLabel: "Мои заявки",
    },
    DISPATCHER: {
        title: "Панель диспетчера",
        subtitle: "Контролируйте очередь заявок и распределение работ.",
        listPath: "/requests",
        listLabel: "Управление заявками",
    },
    ADMIN: {
        title: "Панель администратора",
        subtitle: "Обзор заявок и основных процессов компании.",
        listPath: "/requests",
        listLabel: "Все заявки",
    },
};

const cardSx = {
    border: `1px solid ${COLORS.border}`,
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.025)",
    backgroundColor: "#FFFFFF",
    minWidth: 0,
};

const buttonSx = {
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.875rem",
    boxShadow: "none",
};

function unwrapList(result) {
    if (Array.isArray(result)) return result;
    return result?.content ?? result?.requests ?? result?.data ?? [];
}

function getStatus(request) {
    return String(request?.status ?? "UNKNOWN").toUpperCase();
}

function getStatusInfo(status) {
    return STATUS_INFO[status] ?? {
        label: status === "UNKNOWN" ? "Статус не указан" : status,
        color: "default",
    };
}

function formatDate(value) {
    if (!value) return "Дата не указана";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Дата не указана";

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

function getRequestTitle(request) {
    const id = request?.id ?? request?.requestId;
    return id ? `Заявка № ${String(id).slice(0, 8)}` : "Заявка без номера";
}

function getRequestDate(request) {
    return (
        request?.createdAt ??
        request?.created_at ??
        request?.createdDate ??
        request?.createdOn
    );
}

function getGreetingName(user) {
    return user?.firstName || user?.first_name || "пользователь";
}

function getFullName(user) {
    return (
        [user?.lastName, user?.firstName, user?.middleName]
            .filter(Boolean)
            .join(" ") || "Не указано"
    );
}

function SectionTitle({ title, subtitle, action }) {
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={1}
            sx={{ px: 2.5, py: 2 }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Typography
                    sx={{
                        fontSize: "1rem",
                        fontWeight: 650,
                        color: COLORS.text,
                        letterSpacing: "-0.2px",
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="body2"
                        sx={{ color: COLORS.secondary, mt: 0.4, fontSize: "0.8rem" }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {action}
        </Stack>
    );
}

function MetricCard({ title, value, caption, icon: Icon, accent, onClick }) {
    return (
        <Card
            onClick={onClick}
            sx={{
                ...cardSx,
                height: "100%",
                cursor: onClick ? "pointer" : "default",
                transition: "border-color .18s ease, box-shadow .18s ease",
                "&:hover": onClick
                    ? {
                          borderColor: "#CBD8EA",
                          boxShadow: "0 5px 16px rgba(15, 23, 42, 0.05)",
                      }
                    : undefined,
            }}
        >
            <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1.5}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontSize: "0.82rem",
                                color: COLORS.secondary,
                                fontWeight: 500,
                                lineHeight: 1.4,
                            }}
                        >
                            {title}
                        </Typography>

                        <Typography
                            sx={{
                                mt: 1,
                                fontSize: "2rem",
                                lineHeight: 1.15,
                                fontWeight: 650,
                                letterSpacing: "-1px",
                                color: COLORS.text,
                            }}
                        >
                            {value}
                        </Typography>

                        {caption && (
                            <Typography
                                sx={{
                                    mt: 0.75,
                                    fontSize: "0.75rem",
                                    color: COLORS.secondary,
                                    lineHeight: 1.5,
                                }}
                            >
                                {caption}
                            </Typography>
                        )}
                    </Box>

                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            flexShrink: 0,
                            borderRadius: "10px",
                            display: "grid",
                            placeItems: "center",
                            color: accent,
                            backgroundColor: `${accent}12`,
                        }}
                    >
                        <Icon sx={{ fontSize: 21 }} />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function RequestRow({ request, onClick }) {
    const statusInfo = getStatusInfo(getStatus(request));
    const id = request?.id ?? request?.requestId;

    return (
        <Box
            onClick={onClick}
            sx={{
                px: 2.5,
                py: 1.75,
                display: "flex",
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                gap: 1.5,
                flexDirection: { xs: "column", sm: "row" },
                cursor: onClick ? "pointer" : "default",
                transition: "background-color .15s ease",
                "&:hover": onClick ? { backgroundColor: "#F8FAFC" } : undefined,
            }}
        >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Box
                    sx={{
                        width: 38,
                        height: 38,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "9px",
                        backgroundColor: "#EFF6FF",
                        color: COLORS.primary,
                    }}
                >
                    <AssignmentOutlinedIcon sx={{ fontSize: 20 }} />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: COLORS.text,
                        }}
                    >
                        {getRequestTitle(request)}
                    </Typography>
                    <Typography
                        sx={{ fontSize: "0.78rem", color: COLORS.secondary, mt: 0.3 }}
                    >
                        {formatDate(getRequestDate(request))}
                    </Typography>
                </Box>
            </Stack>

            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flexShrink: 0, maxWidth: "100%", flexWrap: "wrap" }}
            >
                <Chip
                    label={statusInfo.label}
                    color={statusInfo.color}
                    size="small"
                    variant="outlined"
                    sx={{
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                    }}
                />
                {id && (
                    <Typography sx={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                        …{String(id).slice(-6)}
                    </Typography>
                )}
            </Stack>
        </Box>
    );
}

function DashboardPage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [error, setError] = useState("");
    const [requestsError, setRequestsError] = useState("");

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setRequestsLoading(true);
        setError("");
        setRequestsError("");

        try {
            const profile = await getCurrentProfile();
            setUser(profile);

            try {
                let result;

                switch (profile?.role) {
                    case "CLIENT":
                        result = await getMyRequests();
                        break;
                    case "ENGINEER":
                        result = await getMasterRequests();
                        break;
                    case "ADMIN":
                    case "DISPATCHER":
                        result = await getAllRequests();
                        break;
                    default:
                        result = [];
                }

                setRequests(unwrapList(result));
            } catch (requestError) {
                console.error("Не удалось загрузить заявки:", requestError);
                setRequests([]);
                setRequestsError(
                    "Не удалось загрузить заявки. Проверьте доступность сервиса и повторите попытку."
                );
            } finally {
                setRequestsLoading(false);
            }
        } catch (profileError) {
            console.error("Не удалось загрузить профиль:", profileError);
            setError("Не удалось загрузить профиль. Возможно, сессия завершена.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const role = user?.role ?? "CLIENT";
    const roleInfo = ROLE_INFO[role] ?? ROLE_INFO.CLIENT;

    const metrics = useMemo(() => {
        const statuses = requests.map(getStatus);
        const count = (predicate) => statuses.filter(predicate).length;

        const total = requests.length;
        const active = count((s) => ACTIVE_STATUSES.has(s));
        const inProgress = count((s) => s === "IN_PROGRESS");
        const waitingAssignment = count(
            (s) => s === "WAITING_FOR_ASSIGNMENT" || s === "NEW"
        );
        const reportReview = count((s) => s === "REPORT_SUBMITTED");
        const revision = count((s) => s === "REVISION_REQUIRED");
        const completed = count((s) => s === "COMPLETED");
        const assigned = count((s) => s === "ASSIGNED" || s === "ACCEPTED");

        if (role === "CLIENT") {
            return [
                {
                    title: "Всего заявок",
                    value: total,
                    caption: "Все обращения",
                    icon: AssignmentOutlinedIcon,
                    accent: "#2563EB",
                },
                {
                    title: "Активные заявки",
                    value: active,
                    caption: "Ещё не завершены",
                    icon: AccessTimeOutlinedIcon,
                    accent: "#D97706",
                },
                {
                    title: "Отчёты на проверке",
                    value: reportReview,
                    caption: "Ожидают вашего решения",
                    icon: ReportProblemOutlinedIcon,
                    accent: "#7C3AED",
                },
                {
                    title: "Завершено",
                    value: completed,
                    caption: "Закрытые заявки",
                    icon: CheckCircleIcon,
                    accent: "#059669",
                },
            ];
        }

        if (role === "ENGINEER") {
            return [
                {
                    title: "Мои заявки",
                    value: total,
                    caption: "Назначенные вам заявки",
                    icon: AssignmentOutlinedIcon,
                    accent: "#2563EB",
                },
                {
                    title: "Ожидают принятия",
                    value: assigned,
                    caption: "Нужно принять или отклонить",
                    icon: AccessTimeOutlinedIcon,
                    accent: "#D97706",
                },
                {
                    title: "В работе",
                    value: inProgress,
                    caption: "Текущие работы",
                    icon: EngineeringOutlinedIcon,
                    accent: "#0891B2",
                },
                {
                    title: "На доработке",
                    value: revision,
                    caption: "Нужно исправить отчёт",
                    icon: ReportProblemOutlinedIcon,
                    accent: "#DC2626",
                },
            ];
        }

        if (role === "DISPATCHER") {
            return [
                {
                    title: "Всего заявок",
                    value: total,
                    caption: "Заявки в системе",
                    icon: AssignmentOutlinedIcon,
                    accent: "#2563EB",
                },
                {
                    title: "Без назначения",
                    value: waitingAssignment,
                    caption: "Требуют распределения",
                    icon: AccessTimeOutlinedIcon,
                    accent: "#D97706",
                },
                {
                    title: "В работе",
                    value: inProgress,
                    caption: "Выполняются мастерами",
                    icon: EngineeringOutlinedIcon,
                    accent: "#0891B2",
                },
                {
                    title: "На доработке",
                    value: revision,
                    caption: "Требуют контроля",
                    icon: ReportProblemOutlinedIcon,
                    accent: "#DC2626",
                },
            ];
        }

        return [
            {
                title: "Всего заявок",
                value: total,
                caption: "Заявки в системе",
                icon: AssignmentOutlinedIcon,
                accent: "#2563EB",
            },
            {
                title: "Без назначения",
                value: waitingAssignment,
                caption: "Ожидают распределения",
                icon: AccessTimeOutlinedIcon,
                accent: "#D97706",
            },
            {
                title: "В работе",
                value: inProgress,
                caption: "Активные работы",
                icon: EngineeringOutlinedIcon,
                accent: "#0891B2",
            },
            {
                title: "Завершено",
                value: completed,
                caption: "Закрытые заявки",
                icon: CheckCircleIcon,
                accent: "#059669",
            },
        ];
    }, [requests, role]);

    const attentionItems = useMemo(() => {
        const statuses =
            role === "CLIENT"
                ? ["REPORT_SUBMITTED", "REVISION_REQUIRED"]
                : role === "ENGINEER"
                  ? ["ASSIGNED", "REVISION_REQUIRED"]
                  : ["NEW", "WAITING_FOR_ASSIGNMENT", "REVISION_REQUIRED"];

        return requests.filter((request) => statuses.includes(getStatus(request)));
    }, [requests, role]);

    const recentRequests = useMemo(
        () =>
            [...requests]
                .sort((a, b) => {
                    const dateA = new Date(getRequestDate(a) || 0).getTime();
                    const dateB = new Date(getRequestDate(b) || 0).getTime();
                    return dateB - dateA;
                })
                .slice(0, 5),
        [requests]
    );

    const handleOpenRequests = () => navigate(roleInfo.listPath);

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "70vh",
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: COLORS.background,
                }}
            >
                <CircularProgress size={30} />
            </Box>
        );
    }

    if (error || !user) {
        return (
            <Box
                sx={{
                    minHeight: "70vh",
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: COLORS.background,
                    p: 3,
                }}
            >
                <Card sx={{ ...cardSx, width: "100%", maxWidth: 480 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Alert severity="error">
                            {error || "Не удалось определить пользователя."}
                        </Alert>
                        <Button
                            sx={{ ...buttonSx, mt: 2 }}
                            variant="contained"
                            onClick={() => navigate("/", { replace: true })}
                        >
                            Перейти ко входу
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <MainLayout user={user}>
            <Box sx={{ backgroundColor: COLORS.background, minHeight: "100%" }}>
                <Container
                    maxWidth="xl"
                    sx={{
                        py: { xs: 2, md: 3 },
                        px: { xs: 2, md: 3 },
                    }}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        alignItems={{ xs: "stretch", md: "center" }}
                        justifyContent="space-between"
                        spacing={2}
                        sx={{ mb: 3 }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                sx={{
                                    fontSize: { xs: "1.45rem", md: "1.75rem" },
                                    lineHeight: 1.25,
                                    fontWeight: 650,
                                    letterSpacing: "-0.6px",
                                    color: COLORS.text,
                                }}
                            >
                                {roleInfo.title}
                            </Typography>
                            <Typography
                                sx={{
                                    mt: 0.75,
                                    fontSize: "0.875rem",
                                    lineHeight: 1.6,
                                    color: COLORS.secondary,
                                }}
                            >
                                Добро пожаловать, {getGreetingName(user)}!{" "}
                                {roleInfo.subtitle}
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} flexShrink={0}>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshOutlinedIcon />}
                                onClick={loadDashboard}
                                sx={{
                                    ...buttonSx,
                                    borderColor: "#D8E1EE",
                                    color: "#334155",
                                    backgroundColor: "#FFFFFF",
                                    px: 1.75,
                                    "&:hover": {
                                        borderColor: "#B7C7DC",
                                        backgroundColor: "#F8FAFC",
                                    },
                                }}
                            >
                                Обновить
                            </Button>

                            {role === "CLIENT" && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenRequests}
                                    sx={{
                                        ...buttonSx,
                                        px: 1.75,
                                        backgroundColor: COLORS.primary,
                                    }}
                                >
                                    Мои заявки
                                </Button>
                            )}
                        </Stack>
                    </Stack>

                    {requestsError && (
                        <Alert
                            severity="warning"
                            sx={{ mb: 2.5, borderRadius: "10px" }}
                            action={
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={loadDashboard}
                                >
                                    Повторить
                                </Button>
                            }
                        >
                            {requestsError}
                        </Alert>
                    )}

                    <Grid container spacing={2} sx={{ mb: 2.5 }}>
                        {metrics.map((metric) => (
                            <Grid key={metric.title} size={{ xs: 12, sm: 6, xl: 3 }}>
                                <MetricCard {...metric} onClick={handleOpenRequests} />
                            </Grid>
                        ))}
                    </Grid>

                    <Grid container spacing={2} alignItems="start">
                        <Grid size={{ xs: 12, lg: 8 }}>
                            <Card sx={cardSx}>
                                <SectionTitle
                                    title="Последние заявки"
                                    subtitle="Недавние обращения, доступные вашей роли"
                                    action={
                                        <Button
                                            endIcon={<ArrowForwardOutlinedIcon />}
                                            onClick={handleOpenRequests}
                                            sx={{
                                                ...buttonSx,
                                                color: COLORS.primary,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            Все заявки
                                        </Button>
                                    }
                                />

                                <Divider sx={{ borderColor: "#EEF2F7" }} />

                                {requestsLoading ? (
                                    <Box sx={{ p: 3 }}>
                                        <LinearProgress sx={{ borderRadius: 2 }} />
                                    </Box>
                                ) : recentRequests.length === 0 ? (
                                    <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
                                        <Box
                                            sx={{
                                                mx: "auto",
                                                mb: 1.5,
                                                width: 48,
                                                height: 48,
                                                display: "grid",
                                                placeItems: "center",
                                                borderRadius: "12px",
                                                backgroundColor: "#F1F5F9",
                                                color: "#64748B",
                                            }}
                                        >
                                            <AssignmentOutlinedIcon />
                                        </Box>
                                        <Typography
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: "0.95rem",
                                                color: COLORS.text,
                                            }}
                                        >
                                            Заявок пока нет
                                        </Typography>
                                        <Typography
                                            sx={{
                                                mt: 0.5,
                                                fontSize: "0.82rem",
                                                color: COLORS.secondary,
                                            }}
                                        >
                                            {role === "CLIENT"
                                                ? "Создайте заявку, чтобы заказать обслуживание."
                                                : "Когда появятся заявки, они отобразятся здесь."}
                                        </Typography>
                                        {role === "CLIENT" && (
                                            <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={handleOpenRequests}
                                                sx={{ ...buttonSx, mt: 2 }}
                                            >
                                                Создать или посмотреть заявки
                                            </Button>
                                        )}
                                    </Box>
                                ) : (
                                    <Box>
                                        {recentRequests.map((request, index) => (
                                            <Box
                                                key={
                                                    request?.id ??
                                                    request?.requestId ??
                                                    `${getStatus(request)}-${index}`
                                                }
                                            >
                                                <RequestRow
                                                    request={request}
                                                    onClick={handleOpenRequests}
                                                />
                                                {index < recentRequests.length - 1 && (
                                                    <Divider
                                                        sx={{
                                                            mx: 2.5,
                                                            borderColor: "#EEF2F7",
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, lg: 4 }}>
                            <Stack spacing={2}>
                                <Card sx={cardSx}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack
                                            direction="row"
                                            spacing={1.5}
                                            alignItems="center"
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: "11px",
                                                    backgroundColor: "#EFF6FF",
                                                    color: COLORS.primary,
                                                }}
                                            >
                                                <PersonOutlineOutlinedIcon />
                                            </Avatar>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: "1rem",
                                                        fontWeight: 650,
                                                        color: COLORS.text,
                                                    }}
                                                >
                                                    Мой профиль
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.78rem",
                                                        color: COLORS.secondary,
                                                        mt: 0.25,
                                                    }}
                                                >
                                                    Данные учётной записи
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Divider sx={{ my: 2, borderColor: "#EEF2F7" }} />

                                        <Stack spacing={1.5}>
                                            {[
                                                ["ФИО", getFullName(user)],
                                                ["Роль", role],
                                                ["Электронная почта", user.email || "Не указана"],
                                                ["Телефон", user.phone || "Не указан"],
                                            ].map(([label, value]) => (
                                                <Box key={label} sx={{ minWidth: 0 }}>
                                                    <Typography
                                                        sx={{
                                                            fontSize: "0.73rem",
                                                            color: COLORS.secondary,
                                                            mb: 0.25,
                                                        }}
                                                    >
                                                        {label}
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontSize: "0.84rem",
                                                            fontWeight: 550,
                                                            color: COLORS.text,
                                                            overflowWrap: "anywhere",
                                                        }}
                                                    >
                                                        {value}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>

                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={() => navigate("/profile")}
                                            sx={{
                                                ...buttonSx,
                                                mt: 2.25,
                                                borderColor: "#D8E1EE",
                                            }}
                                        >
                                            Открыть профиль
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card sx={cardSx}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            sx={{ mb: 0.75 }}
                                        >
                                            <EventOutlinedIcon
                                                sx={{
                                                    color: COLORS.primary,
                                                    fontSize: 21,
                                                }}
                                            />
                                            <Typography
                                                sx={{
                                                    fontSize: "1rem",
                                                    fontWeight: 650,
                                                    color: COLORS.text,
                                                }}
                                            >
                                                {role === "CLIENT"
                                                    ? "Требуют вашего внимания"
                                                    : role === "ENGINEER"
                                                      ? "Ближайшие действия"
                                                      : "Требуют внимания"}
                                            </Typography>
                                        </Stack>

                                        <Typography
                                            sx={{
                                                fontSize: "0.8rem",
                                                lineHeight: 1.55,
                                                color: COLORS.secondary,
                                                mb: 2,
                                            }}
                                        >
                                            {role === "CLIENT"
                                                ? "Отчёты, которые нужно проверить, и заявки на доработке."
                                                : role === "ENGINEER"
                                                  ? "Назначения, которые нужно принять, и отчёты на доработке."
                                                  : "Новые заявки, заявки без назначения и отчёты на доработке."}
                                        </Typography>

                                        {requestsLoading ? (
                                            <LinearProgress sx={{ borderRadius: 2 }} />
                                        ) : attentionItems.length === 0 ? (
                                            <Alert
                                                severity="success"
                                                icon={<CheckCircleIcon />}
                                                sx={{
                                                    borderRadius: "9px",
                                                    fontSize: "0.8rem",
                                                    alignItems: "center",
                                                }}
                                            >
                                                Сейчас нет заявок, требующих внимания.
                                            </Alert>
                                        ) : (
                                            <Stack spacing={1}>
                                                {attentionItems
                                                    .slice(0, 4)
                                                    .map((request, index) => {
                                                        const statusInfo = getStatusInfo(
                                                            getStatus(request)
                                                        );

                                                        return (
                                                            <Box
                                                                key={
                                                                    request?.id ??
                                                                    request?.requestId ??
                                                                    index
                                                                }
                                                                onClick={handleOpenRequests}
                                                                sx={{
                                                                    p: 1.25,
                                                                    border: "1px solid #EEF2F7",
                                                                    borderRadius: "9px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    gap: 1,
                                                                    cursor: "pointer",
                                                                    "&:hover": {
                                                                        backgroundColor: "#F8FAFC",
                                                                    },
                                                                }}
                                                            >
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: "0.8rem",
                                                                            fontWeight: 600,
                                                                            color: COLORS.text,
                                                                        }}
                                                                    >
                                                                        {getRequestTitle(request)}
                                                                    </Typography>
                                                                    <Typography
                                                                        sx={{
                                                                            fontSize: "0.72rem",
                                                                            color: COLORS.secondary,
                                                                            mt: 0.25,
                                                                        }}
                                                                    >
                                                                        {formatDate(
                                                                            getRequestDate(request)
                                                                        )}
                                                                    </Typography>
                                                                </Box>

                                                                <Chip
                                                                    size="small"
                                                                    label={statusInfo.label}
                                                                    color={statusInfo.color}
                                                                    variant="outlined"
                                                                    sx={{
                                                                        maxWidth: "55%",
                                                                        borderRadius: "6px",
                                                                        fontSize: "0.68rem",
                                                                        flexShrink: 0,
                                                                    }}
                                                                />
                                                            </Box>
                                                        );
                                                    })}

                                                {attentionItems.length > 4 && (
                                                    <Typography
                                                        sx={{
                                                            fontSize: "0.75rem",
                                                            color: COLORS.secondary,
                                                        }}
                                                    >
                                                        И ещё {attentionItems.length - 4}…
                                                    </Typography>
                                                )}

                                                <Button
                                                    endIcon={<ArrowForwardOutlinedIcon />}
                                                    onClick={handleOpenRequests}
                                                    sx={{
                                                        ...buttonSx,
                                                        alignSelf: "flex-start",
                                                        mt: 0.5,
                                                        color: COLORS.primary,
                                                    }}
                                                >
                                                    Перейти к заявкам
                                                </Button>
                                            </Stack>
                                        )}
                                    </CardContent>
                                </Card>
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </MainLayout>
    );
}

export default DashboardPage;
