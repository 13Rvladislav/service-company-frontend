
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
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { getAllCities, getStreetsByCity, getHousesByStreet } from "../api/addressApi";
import { getMyEquipment } from "../api/equipmentApi";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";
import { createRequest, getMyRequests } from "../api/requestApi";

const STATUS_INFO = {
    NEW: { label: "Новая", color: "info", description: "Заявка создана." },
    WAITING_FOR_ASSIGNMENT: {
        label: "Ожидает назначения",
        color: "warning",
        description: "Ожидается назначение мастера.",
    },
    ASSIGNED: {
        label: "Мастер назначен",
        color: "primary",
        description: "На заявку назначен мастер.",
    },
    ACCEPTED: {
        label: "Принята мастером",
        color: "primary",
        description: "Мастер принял заявку.",
    },
    IN_PROGRESS: {
        label: "В работе",
        color: "warning",
        description: "Мастер выполняет работы.",
    },
    REPORT_SUBMITTED: {
        label: "Отчёт отправлен",
        color: "info",
        description: "Мастер отправил отчёт.",
    },
    REVISION_REQUIRED: {
        label: "Требуется доработка",
        color: "warning",
        description: "Требуется дополнительная работа.",
    },
    COMPLETED: {
        label: "Завершена",
        color: "success",
        description: "Работы завершены.",
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

const WORKFLOW = [
    { status: "NEW", label: "Создана" },
    { status: "WAITING_FOR_ASSIGNMENT", label: "Назначение" },
    { status: "ASSIGNED", label: "Мастер назначен" },
    { status: "ACCEPTED", label: "Принята" },
    { status: "IN_PROGRESS", label: "В работе" },
    { status: "REPORT_SUBMITTED", label: "Отчёт" },
    { status: "COMPLETED", label: "Завершена" },
];

const ACTIVE_STATUSES = [
    "NEW",
    "WAITING_FOR_ASSIGNMENT",
    "ASSIGNED",
    "ACCEPTED",
    "IN_PROGRESS",
    "REPORT_SUBMITTED",
    "REVISION_REQUIRED",
];

const FILTERS = [
    { value: "ALL", label: "Все заявки" },
    { value: "ACTIVE", label: "Активные" },
    { value: "NEW", label: "Новые" },
    { value: "IN_PROGRESS", label: "В работе" },
    { value: "COMPLETED", label: "Завершённые" },
    { value: "CANCELLED", label: "Отменённые" },
    { value: "REJECTED", label: "Отклонённые" },
];

function formatDate(value) {
    if (!value) return "Не указано";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Не указано";

    return new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function statusInfo(status) {
    return STATUS_INFO[status] || {
        label: status || "Неизвестен",
        color: "default",
        description: "Описание статуса отсутствует.",
    };
}

function workflowIndex(status) {
    if (status === "REVISION_REQUIRED") return 5;
    if (status === "CANCELLED" || status === "REJECTED") return -1;

    return WORKFLOW.findIndex((step) => step.status === status);
}

function RequestWorkflow({ status }) {
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
                    minWidth: 600,
                    "& .MuiStepLabel-label": { fontSize: 12 },
                }}
            >
                {WORKFLOW.map((step) => (
                    <Step key={step.status}>
                        <StepLabel>{step.label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {info.description}
            </Typography>
        </Box>
    );
}

function RequestDetailsDialog({ request, onClose }) {
    if (!request) return null;

    const info = statusInfo(request.status);

    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                >
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Карточка заявки
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            № {request.id}
                        </Typography>
                    </Box>
                    <Chip label={info.label} color={info.color} size="small" />
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={3}>
                    <Box>
                        <Typography fontWeight={700} mb={1}>
                            Описание проблемы
                        </Typography>
                        <Typography sx={{ whiteSpace: "pre-wrap" }}>
                            {request.problemDescription || "Описание отсутствует"}
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                                Дата создания
                            </Typography>
                            <Typography>{formatDate(request.createdAt)}</Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                                Желаемое время визита
                            </Typography>
                            <Typography>
                                {formatDate(request.preferredVisitAt)}
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                                Адрес
                            </Typography>
                            <Typography sx={{ overflowWrap: "anywhere" }}>
                                {request.addressId || "Не указан"}
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                                Оборудование
                            </Typography>
                            <Typography sx={{ overflowWrap: "anywhere" }}>
                                {request.equipmentId || "Не указано"}
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                                Мастер
                            </Typography>
                            <Typography sx={{ overflowWrap: "anywhere" }}>
                                {request.masterId || "Пока не назначен"}
                            </Typography>
                        </Grid>
                    </Grid>

                    {request.clientComment && (
                        <Box>
                            <Typography fontWeight={700} mb={1}>
                                Комментарий клиента
                            </Typography>
                            <Typography sx={{ whiteSpace: "pre-wrap" }}>
                                {request.clientComment}
                            </Typography>
                        </Box>
                    )}

                    <Divider />

                    <Box>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Workflow заявки
                        </Typography>
                        <RequestWorkflow status={request.status} />
                    </Box>

                    <Alert severity="info">
                        Показан текущий статус. История изменений статусов пока
                        не предоставляется backend.
                    </Alert>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Закрыть</Button>
            </DialogActions>
        </Dialog>
    );
}

export default function MyRequestsPage() {
    const [user, setUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("ALL");
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        addressId: "",
        equipmentId: "",
        problemDescription: "",
        clientComment: "",
        preferredVisitAt: "",
    });

    const [cities, setCities] = useState([]);
    const [streets, setStreets] = useState([]);
    const [houses, setHouses] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [formDataLoading, setFormDataLoading] = useState(false);

    const loadData = useCallback(async (isRefresh = false) => {
        setError("");

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            // Загружаем профиль отдельно: ошибка request-service
            // не должна скрывать пользователя и сайдбар.
            const profile = await getCurrentProfile();
            setUser(profile);
        } catch (e) {
            console.error("Ошибка загрузки профиля:", e);
            setError(
                e.response?.data?.message ||
                "Не удалось загрузить профиль. Проверь авторизацию и user-service."
            );
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const requestList = await getMyRequests();
            setRequests(Array.isArray(requestList) ? requestList : []);
        } catch (e) {
            console.error("Ошибка загрузки заявок:", e);
            setError(
                e.response?.data?.message ||
                "Не удалось загрузить заявки. Проверь доступность request-service."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredRequests = useMemo(() => {
        return requests.filter((request) => {
            switch (filter) {
                case "ACTIVE":
                    return ACTIVE_STATUSES.includes(request.status);
                case "NEW":
                    return request.status === "NEW";
                case "IN_PROGRESS":
                    return request.status === "IN_PROGRESS";
                case "COMPLETED":
                    return request.status === "COMPLETED";
                case "CANCELLED":
                    return request.status === "CANCELLED";
                case "REJECTED":
                    return request.status === "REJECTED";
                default:
                    return true;
            }
        });
    }, [requests, filter]);

    const stats = useMemo(() => ({
        total: requests.length,
        active: requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
        completed: requests.filter((r) => r.status === "COMPLETED").length,
    }), [requests]);

    const openCreateDialog = async () => {
        setError("");
        setSuccess("");

        setForm({
            addressId: user?.houseId ? String(user.houseId) : "",
            equipmentId: "",
            problemDescription: "",
            clientComment: "",
            preferredVisitAt: "",
        });

        setCreateOpen(true);
        setFormDataLoading(true);

        try {
            const [cityList, equipmentList] = await Promise.all([
                getAllCities(),
                getMyEquipment(),
            ]);

            setCities(Array.isArray(cityList) ? cityList : []);
            setEquipment(Array.isArray(equipmentList) ? equipmentList : []);

            if (user?.cityId) {
                const streetList = await getStreetsByCity(user.cityId);
                setStreets(Array.isArray(streetList) ? streetList : []);
            } else {
                setStreets([]);
            }

            if (user?.streetId) {
                const houseList = await getHousesByStreet(user.streetId);
                setHouses(Array.isArray(houseList) ? houseList : []);
            } else {
                setHouses([]);
            }
        } catch (e) {
            console.error("Ошибка загрузки данных формы заявки:", e);
            setError(
                e.response?.data?.message ||
                "Не удалось загрузить адрес профиля или оборудование. Проверь address-service и equipment-service."
            );
        } finally {
            setFormDataLoading(false);
        }
    };

    const handleCreate = async () => {
        setError("");
        setSuccess("");

        if (!form.addressId) {
            setError("Выбери адрес, по которому требуется обслуживание.");
            return;
        }

        if (!form.equipmentId) {
            setError("Выбери оборудование, для которого создаётся заявка.");
            return;
        }

        if (!form.problemDescription.trim()) {
            setError("Заполни описание проблемы.");
            return;
        }

        const payload = {
            addressId: form.addressId,
            equipmentId: form.equipmentId,
            problemDescription: form.problemDescription.trim(),
            clientComment: form.clientComment.trim() || null,
            preferredVisitAt: form.preferredVisitAt
                ? form.preferredVisitAt
                : null,
        };

        try {
            setCreating(true);

            const created = await createRequest(payload);

            setRequests((previous) => [
                created,
                ...previous.filter((item) => item.id !== created.id),
            ]);

            setCreateOpen(false);
            setSuccess("Заявка успешно создана.");
            setSelectedRequest(created);
        } catch (e) {
            console.error("Ошибка создания заявки:", e);

            setError(
                e.response?.data?.message ||
                "Не удалось создать заявку. Проверь данные и доступность backend."
            );
        } finally {
            setCreating(false);
        }
    };

    return (
        <MainLayout user={user}>
            <Box sx={{ maxWidth: 1440, mx: "auto" }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        mb: 3,
                        width: "100%",
                    }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h4" fontWeight={800} color="primary">
                            Мои заявки
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                            Создавайте обращения и отслеживайте ход их обработки.
                        </Typography>
                    </Box>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            ml: { xs: 0, sm: "auto" },
                            alignSelf: { xs: "flex-end", sm: "auto" },
                            flexShrink: 0,
                        }}
                    >
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => loadData(true)}
                            disabled={loading || refreshing}
                            size="small"
                            sx={{
                                height: 40,
                                px: 1.8,
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: 14,
                                color: "#2563EB",
                                borderColor: "#BFDBFE",
                                backgroundColor: "#FFFFFF",
                                whiteSpace: "nowrap",
                                boxShadow: "none",
                                "& .MuiButton-startIcon": { marginRight: 0.7 },
                                "&:hover": {
                                    borderColor: "#93C5FD",
                                    backgroundColor: "#EFF6FF",
                                    boxShadow: "none",
                                },
                            }}
                        >
                            Обновить
                        </Button>

                        {user?.role === "CLIENT" && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={openCreateDialog}
                                size="small"
                                sx={{
                                    height: 40,
                                    px: 1.8,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: 14,
                                    backgroundColor: "#2563EB",
                                    whiteSpace: "nowrap",
                                    boxShadow: "none",
                                    "& .MuiButton-startIcon": { marginRight: 0.7 },
                                    "&:hover": {
                                        backgroundColor: "#1D4ED8",
                                        boxShadow: "none",
                                    },
                                }}
                            >
                                Создать заявку
                            </Button>
                        )}
                    </Stack>
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

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        {
                            label: "Всего заявок",
                            value: stats.total,
                            color: "#2563EB",
                        },
                        {
                            label: "Активные",
                            value: stats.active,
                            color: "#D97706",
                        },
                        {
                            label: "Завершённые",
                            value: stats.completed,
                            color: "#16A34A",
                        },
                    ].map((item) => (
                        <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
                            <Card sx={{ borderRadius: 3, height: "100%" }}>
                                <CardContent>
                                    <Typography color="text.secondary" variant="body2">
                                        {item.label}
                                    </Typography>
                                    <Typography
                                        variant="h3"
                                        fontWeight={800}
                                        sx={{ mt: 1, color: item.color }}
                                    >
                                        {item.value}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Card sx={{ borderRadius: 3, mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Typography variant="h6" fontWeight={700}>
                                    Список заявок
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Выбери заявку, чтобы открыть подробную карточку.
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, md: 5 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Фильтр по статусу"
                                    value={filter}
                                    onChange={(event) => setFilter(event.target.value)}
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
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredRequests.length === 0 ? (
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ textAlign: "center", py: 8 }}>
                            <AssignmentOutlinedIcon
                                sx={{ fontSize: 54, color: "text.disabled", mb: 1 }}
                            />

                            <Typography variant="h6" fontWeight={700}>
                                {requests.length === 0
                                    ? "У вас пока нет заявок"
                                    : "Заявки не найдены"}
                            </Typography>

                            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                                {requests.length === 0
                                    ? "Создайте первую заявку для обращения в сервисную компанию."
                                    : "Попробуйте выбрать другой фильтр."}
                            </Typography>

                            {requests.length === 0 && user?.role === "CLIENT" && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={openCreateDialog}
                                >
                                    Создать заявку
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Stack spacing={2}>
                        {filteredRequests.map((request) => {
                            const info = statusInfo(request.status);

                            return (
                                <Card
                                    key={request.id}
                                    sx={{
                                        borderRadius: 3,
                                        transition: "box-shadow .2s",
                                        "&:hover": { boxShadow: 5 },
                                    }}
                                >
                                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            justifyContent="space-between"
                                            alignItems={{ xs: "stretch", md: "flex-start" }}
                                            spacing={2}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    flexWrap="wrap"
                                                    gap={1}
                                                    mb={1}
                                                >
                                                    <Typography fontWeight={800}>
                                                        Заявка № {String(request.id).slice(0, 8)}
                                                    </Typography>

                                                    <Chip
                                                        label={info.label}
                                                        color={info.color}
                                                        size="small"
                                                    />
                                                </Stack>

                                                <Typography
                                                    sx={{
                                                        whiteSpace: "pre-wrap",
                                                        overflowWrap: "anywhere",
                                                        mb: 2,
                                                    }}
                                                >
                                                    {request.problemDescription}
                                                </Typography>

                                                <Stack
                                                    direction={{ xs: "column", sm: "row" }}
                                                    spacing={{ xs: 1, sm: 3 }}
                                                    flexWrap="wrap"
                                                >
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
                                                            Создана: {formatDate(request.createdAt)}
                                                        </Typography>
                                                    </Stack>

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        Визит: {formatDate(request.preferredVisitAt)}
                                                    </Typography>
                                                </Stack>

                                                <Box sx={{ mt: 2 }}>
                                                    <RequestWorkflow status={request.status} />
                                                </Box>
                                            </Box>

                                            <Button
                                                variant="outlined"
                                                startIcon={<VisibilityOutlinedIcon />}
                                                onClick={() => setSelectedRequest(request)}
                                                sx={{ flexShrink: 0 }}
                                            >
                                                Открыть карточку
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </Box>

            {/* Создание заявки */}
            <Dialog
                open={createOpen}
                onClose={() => !creating && setCreateOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Typography variant="h6" fontWeight={800}>
                        Создание заявки
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Опишите проблему и укажите удобное время визита.
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            Контактные данные
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="ФИО клиента"
                                    fullWidth
                                    value={[user?.lastName, user?.firstName, user?.middleName].filter(Boolean).join(" ") || "Не указано"}
                                    slotProps={{ input: { readOnly: true } }}
                                    sx={{
                                        "& .MuiInputBase-root": { backgroundColor: "#F3F4F6" },
                                        "& .MuiInputBase-input": { color: "#6B7280", cursor: "default" },
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Телефон"
                                    fullWidth
                                    value={user?.phone || "Не указан"}
                                    slotProps={{ input: { readOnly: true } }}
                                    sx={{
                                        "& .MuiInputBase-root": { backgroundColor: "#F3F4F6" },
                                        "& .MuiInputBase-input": { color: "#6B7280", cursor: "default" },
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Электронная почта"
                                    fullWidth
                                    value={user?.email || "Не указана"}
                                    slotProps={{ input: { readOnly: true } }}
                                    sx={{
                                        "& .MuiInputBase-root": { backgroundColor: "#F3F4F6" },
                                        "& .MuiInputBase-input": { color: "#6B7280", cursor: "default" },
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Divider />

                        <Typography variant="subtitle2" fontWeight={700}>
                            Место обслуживания
                        </Typography>

                        {formDataLoading && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CircularProgress size={18} />
                                <Typography variant="body2" color="text.secondary">
                                    Загружаем адреса и оборудование...
                                </Typography>
                            </Box>
                        )}

                        <TextField
                            label="Город"
                            fullWidth
                            value={
                                cities.find((item) => String(item.id) === String(user?.cityId))?.name
                                || "Не указан в профиле"
                            }
                            slotProps={{ input: { readOnly: true } }}
                            sx={{
                                "& .MuiInputBase-root": { backgroundColor: "#F3F4F6" },
                                "& .MuiInputBase-input": { color: "#6B7280", cursor: "default" },
                            }}
                        />

                        <TextField
                            label="Улица"
                            fullWidth
                            value={
                                streets.find((item) => String(item.id) === String(user?.streetId))?.name
                                || "Не указана в профиле"
                            }
                            slotProps={{ input: { readOnly: true } }}
                            sx={{
                                "& .MuiInputBase-root": { backgroundColor: "#F3F4F6" },
                                "& .MuiInputBase-input": { color: "#6B7280", cursor: "default" },
                            }}
                        />

                        <TextField
                            label="Дом"
                            required
                            fullWidth
                            value={(() => {
                                const house = houses.find(
                                    (item) => String(item.id) === String(user?.houseId)
                                );
                                return house
                                    ? house.number || house.houseNumber || house.name || `Дом ${user.houseId}`
                                    : "Не указан в профиле";
                            })()}
                            slotProps={{ input: { readOnly: true } }}
                            sx={{
                                "& .MuiInputBase-root": { backgroundColor: "#F3F4F6" },
                                "& .MuiInputBase-input": { color: "#6B7280", cursor: "default" },
                            }}
                            helperText={
                                user?.houseId
                                    ? "Адрес автоматически взят из вашего профиля."
                                    : "Сначала укажите адрес в разделе «Профиль»."
                            }
                        />

                        <TextField
                            select
                            label="Оборудование"
                            required
                            fullWidth
                            value={form.equipmentId}
                            disabled={formDataLoading}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    equipmentId: event.target.value,
                                }))
                            }
                            helperText="Обязательно выберите оборудование для этой заявки."
                        >
                            <MenuItem value="" disabled>Выберите оборудование</MenuItem>
                            {equipment.map((item) => (
                                <MenuItem key={item.id} value={String(item.id)}>
                                    {[
                                        item.name,
                                        item.equipmentTypeName,
                                        item.typeName,
                                        item.serialNumber ? `№ ${item.serialNumber}` : null,
                                    ].filter(Boolean).join(" · ") || `Оборудование ${String(item.id).slice(0, 8)}`}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Divider />

                        <Typography variant="subtitle2" fontWeight={700}>
                            Описание обращения
                        </Typography>

                        <TextField
                            label="Описание проблемы"
                            required
                            multiline
                            minRows={4}
                            maxRows={8}
                            fullWidth
                            value={form.problemDescription}
                            inputProps={{ maxLength: 5000 }}
                            helperText={`${form.problemDescription.length}/5000`}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    problemDescription: event.target.value,
                                }))
                            }
                        />

                        <TextField
                            label="Комментарий"
                            multiline
                            minRows={2}
                            maxRows={5}
                            fullWidth
                            value={form.clientComment}
                            inputProps={{ maxLength: 2000 }}
                            helperText={`${form.clientComment.length}/2000`}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    clientComment: event.target.value,
                                }))
                            }
                        />

                        <TextField
                            label="Желаемое время визита"
                            type="datetime-local"
                            fullWidth
                            value={form.preferredVisitAt}
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: {
                                    min: new Date(
                                    Date.now() - new Date().getTimezoneOffset() * 60000
                                    ).toISOString().slice(0, 16),
                                },
                            }}
                            onChange={(event) =>
                                setForm((previous) => ({
                                    ...previous,
                                    preferredVisitAt: event.target.value,
                                }))
                            }
                            helperText="Необязательно. Укажите удобные дату и время."
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setCreateOpen(false)}
                        disabled={creating}
                    >
                        Отмена
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={
                            creating ? <CircularProgress size={18} /> : <AddIcon />
                        }
                        onClick={handleCreate}
                        disabled={
                            creating ||
                            !form.problemDescription.trim() ||
                            !form.addressId ||
                            !form.equipmentId ||
                            formDataLoading
                        }
                    >
                        {creating ? "Создание..." : "Создать заявку"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Подробная карточка заявки */}
            <RequestDetailsDialog
                request={selectedRequest}
                onClose={() => setSelectedRequest(null)}
            />
        </MainLayout>
    );
}
