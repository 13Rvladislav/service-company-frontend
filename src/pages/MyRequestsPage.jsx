
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
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";
import { createRequest, getMyRequests, getRequestById, updateRequest, cancelRequest, getCreateRequestForm } from "../api/requestApi";

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

function getEntityName(entity, fallback = "") {
    if (!entity) return fallback;
    if (typeof entity === "string" || typeof entity === "number") return String(entity);

    return [
        entity.name,
        entity.title,
        entity.label,
        entity.equipmentTypeName,
        entity.typeName,
        entity.model,
        entity.brand,
        entity.serialNumber ? `№ ${entity.serialNumber}` : null,
    ].filter(Boolean).join(" · ") || fallback;
}

function getReadableAddress(request) {
    // Квартира может приходить отдельным полем request.apartment,
    // а адрес — объектом address. Проверяем оба варианта ответа backend.
    const address = request.address;
    const apartmentValue = address && typeof address === "object"
        ? (address.apartment ?? request.apartment)
        : request.apartment;
    const apartment = apartmentValue != null && String(apartmentValue).trim()
        ? `кв. ${String(apartmentValue).trim()}`
        : null;

    if (address && typeof address === "object") {
        const parts = [
            address.cityName || address.city?.name || address.city,
            address.streetName || address.street?.name || address.street,
            address.houseNumber || address.house?.number || address.house?.houseNumber,
            apartment,
        ].filter((part) => part && typeof part !== "object");
        if (parts.length) return parts.join(", ");
    }

    if (typeof address === "string" && address.trim()) {
        return [address.trim(), apartment].filter(Boolean).join(", ");
    }
    const fallback = request.addressId ? `ID адреса: ${request.addressId}` : "Адрес не предоставлен backend";
    return [fallback, apartment].filter(Boolean).join(", ");
}

function getReadableEquipment(request) {
    // Не ищем оборудование в профиле или стороннем справочнике.
    const equipment = request.equipment;
    if (!equipment || typeof equipment !== "object") {
        return request.equipmentId ? `ID оборудования: ${request.equipmentId}` : "Оборудование не предоставлено backend";
    }

    const typeName = equipment.equipmentTypeName;
    const model = equipment.model;
    return [typeName, model].filter(Boolean).join(" ") || "Оборудование не предоставлено backend";
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

function RequestDetailsDialog({ request, onClose, onEdit, onCancel, busy }) {
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
                                {getReadableAddress(request)}
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                                Оборудование
                            </Typography>
                            <Typography sx={{ overflowWrap: "anywhere" }}>
                                {getReadableEquipment(request)}
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                                Мастер
                            </Typography>
                            <Typography sx={{ overflowWrap: "anywhere" }}>
                                {request.master
                                    ? [
                                        [request.master.lastName, request.master.firstName, request.master.middleName]
                                            .filter(Boolean)
                                            .join(" "),
                                        request.master.phone ? `Телефон: ${request.master.phone}` : null,
                                    ]
                                        .filter(Boolean)
                                        .join("\n")
                                    : "Пока не назначен"}
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

                    {request.status === "ACCEPTED" ? (
                        <Alert severity="success">
                            Заявка принята мастером. Редактирование и отмена через кабинет клиента недоступны.
                        </Alert>
                    ) : request.status === "CANCELLED" ? (
                        <Alert severity="info">
                            Заявка отменена. Редактирование и повторная отмена недоступны.
                        </Alert>
                    ) : (
                        <Alert severity="info">
                            До принятия заявки мастером можно изменить описание, комментарий и желаемое время визита, а также отменить заявку.
                        </Alert>
                    )}

                    <Alert severity="info">
                        Показан текущий статус. История изменений статусов пока
                        не предоставляется backend.
                    </Alert>
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    p: 2,
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                }}
            >
                {!(["ACCEPTED", "CANCELLED", "COMPLETED", "REJECTED"].includes(request.status)) && (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                            color="error"
                            startIcon={<CancelOutlinedIcon />}
                            onClick={onCancel}
                            disabled={busy}
                        >
                            Отменить заявку
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<EditOutlinedIcon />}
                            onClick={onEdit}
                            disabled={busy}
                        >
                            Редактировать
                        </Button>
                    </Stack>
                )}
                <Button onClick={onClose} disabled={busy}>Закрыть</Button>
            </DialogActions>
        </Dialog>
    );
}

function getRequestErrorMessage(error, preferredVisitAt = "") {
    const data = error?.response?.data;
    const validationErrors = data?.validationErrors || data?.errors;

    if (validationErrors && typeof validationErrors === "object") {
        const messages = Object.entries(validationErrors).map(([field, message]) => {
            const fieldName = {
                addressId: "Адрес",
                equipmentId: "Оборудование",
                problemDescription: "Описание проблемы",
                clientComment: "Комментарий",
                preferredVisitAt: "Дата и время визита",
                apartment: "Квартира",
            }[field] || field;
            return `${fieldName}: ${Array.isArray(message) ? message.join("; ") : message}`;
        }).filter(Boolean);
        if (messages.length) return messages.join("\n");
    }

    const raw = String(data?.message || data?.detail || error?.message || "").toLowerCase();
    if (raw.includes("preferredvisitat") || raw.includes("visit") || raw.includes("время") || raw.includes("дат") || raw.includes("future")) {
        return "Некорректная дата или время визита. Выберите дату и время в будущем либо оставьте поле пустым.";
    }
    if (raw.includes("equipmentid") || raw.includes("equipment") || raw.includes("оборудован")) {
        return "Не выбрано оборудование или оно недоступно. Выберите оборудование из списка.";
    }
    if (raw.includes("addressid") || raw.includes("address") || raw.includes("адрес")) {
        return "Не выбран адрес обслуживания. Выберите адрес из списка.";
    }
    if (raw.includes("problemdescription") || raw.includes("description") || raw.includes("описан")) {
        return "Проверьте описание проблемы: поле обязательно для заполнения.";
    }
    if (raw.includes("validation") || raw.includes("валидац") || raw.includes("bad request")) {
        return "Проверьте заполненные поля: адрес, оборудование и описание проблемы. Дата визита, если указана, должна быть в будущем.";
    }
    return data?.message || data?.detail || "Не удалось выполнить запрос. Проверьте заполненные поля и попробуйте ещё раз.";
}

export default function MyRequestsPage() {
    const [user, setUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("ALL");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editError, setEditError] = useState("");
    const [editing, setEditing] = useState(false);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [editForm, setEditForm] = useState({
        problemDescription: "",
        clientComment: "",
        preferredVisitAt: "",
    });

    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [createFieldErrors, setCreateFieldErrors] = useState({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        addressId: "",
        apartment: "",
        equipmentId: "",
        problemDescription: "",
        clientComment: "",
        preferredVisitAt: "",
    });

    const [createAddress, setCreateAddress] = useState(null);
    const [equipment, setEquipment] = useState([]);
    const [formDataLoading, setFormDataLoading] = useState(false);

    const loadData = useCallback(async (isRefresh = false) => {
        setError("");

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        // Профиль и заявки загружаются независимо. Ошибка Request Service
        // не должна сбрасывать авторизованного пользователя в Guest.
        const profilePromise = getCurrentProfile()
            .then((profile) => {
                if (profile) setUser(profile);
                return profile;
            })
            .catch((profileError) => {
                console.error("Ошибка загрузки профиля:", profileError);
                return null;
            });

        const requestsPromise = getMyRequests()
            .then((requestList) => {
                if (Array.isArray(requestList)) {
                    setRequests(requestList);
                    return true;
                }
                throw new Error("Request Service вернул некорректный список заявок.");
            })
            .catch((requestsError) => {
                console.error("Ошибка загрузки заявок:", requestsError);
                setError(
                    requestsError.message ||
                    "Не удалось загрузить заявки. Проверь доступность Request Service."
                );
                // Не обнуляем уже показанные заявки при сетевой ошибке.
                return false;
            });

        try {
            await Promise.all([profilePromise, requestsPromise]);
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

    const toDateTimeLocal = (value) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 16);
    };

    const openRequest = async (request) => {
        // Краткий ответ /requests/my нужен только для списка.
        // Все поля открытой карточки берём исключительно из GET /requests/{id}.
        setSelectedRequest({ id: request.id, _loading: true });

        try {
            const details = await getRequestById(request.id);
            if (!details || typeof details !== "object") {
                throw new Error("Backend не вернул подробности заявки.");
            }
            setSelectedRequest(details);
        } catch (e) {
            console.error("Не удалось загрузить подробности заявки:", e);
            setSelectedRequest({
                id: request.id,
                _loadError: e.message || "Не удалось загрузить карточку заявки.",
            });
        }
    };

    const openEditDialog = (request) => {
        if (!request || request.status === "ACCEPTED") return;

        setError("");
        setEditError("");
        setEditForm({
            problemDescription: request.problemDescription || "",
            clientComment: request.clientComment || "",
            preferredVisitAt: toDateTimeLocal(request.preferredVisitAt),
        });
        setEditOpen(true);
    };

    const handleEdit = async () => {
        if (!selectedRequest || selectedRequest.status === "ACCEPTED") return;

        if (editForm.problemDescription.trim().length < 5) {
            setEditError("Описание проблемы должно содержать минимум 5 символов.");
            return;
        }

        if (editForm.preferredVisitAt) {
            const selectedVisitDate = new Date(editForm.preferredVisitAt);
            if (
                Number.isNaN(selectedVisitDate.getTime()) ||
                selectedVisitDate.getTime() <= Date.now()
            ) {
                setEditError("Желаемое время визита должно быть в будущем. Выберите будущую дату и время.");
                return;
            }
        }

        setEditing(true);
        setEditError("");
        setError("");
        setSuccess("");

        const payload = {
            problemDescription: editForm.problemDescription.trim(),
            clientComment: editForm.clientComment.trim() || null,
            preferredVisitAt: editForm.preferredVisitAt || null,
        };

        try {
            const updated = await updateRequest(selectedRequest.id, payload);
            const merged = { ...selectedRequest, ...(updated || {}), ...payload };

            setRequests((previous) =>
                previous.map((item) => item.id === selectedRequest.id ? merged : item)
            );
            setSelectedRequest(merged);
            setEditOpen(false);
            setSuccess("Заявка успешно обновлена.");
            await loadData(true);
        } catch (e) {
            console.error("Ошибка редактирования заявки:", e);

            setEditError(getRequestErrorMessage(e, editForm.preferredVisitAt));
        } finally {
            setEditing(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!cancelTarget || cancelTarget.status === "ACCEPTED") return;

        setCancelling(true);
        setError("");
        setSuccess("");

        try {
            const cancelled = await cancelRequest(cancelTarget.id);
            const updated = {
                ...cancelTarget,
                ...(cancelled || {}),
                status: cancelled?.status || "CANCELLED",
            };

            setRequests((previous) =>
                previous.map((item) => item.id === cancelTarget.id ? updated : item)
            );

            if (selectedRequest?.id === cancelTarget.id) {
                setSelectedRequest(updated);
            }

            setCancelTarget(null);
            setSuccess("Заявка отменена.");
            await loadData(true);
        } catch (e) {
            console.error("Ошибка отмены заявки:", e);
            setError(
                e.response?.data?.message ||
                e.message ||
                "Не удалось отменить заявку."
            );
        } finally {
            setCancelling(false);
        }
    };

    const openCreateDialog = async () => {
        setError("");
        setCreateError("");
        setCreateFieldErrors({});
        setSuccess("");
        setFormDataLoading(true);
        setCreateAddress(null);
        setEquipment([]);
        setForm({
            addressId: "",
            apartment: "",
            equipmentId: "",
            problemDescription: "",
            clientComment: "",
            preferredVisitAt: "",
        });
        setCreateOpen(true);

        try {
            // Единственный запрос для данных формы создания заявки.
            const data = await getCreateRequestForm();
            const address = data?.address;

            if (!data?.client || !address || address.houseId == null) {
                throw new Error("Request Service вернул неполные данные формы создания заявки.");
            }

            // Авторизованный пользователь берётся из user-service, не из формы заявки.
            setCreateAddress(address);
            setEquipment(Array.isArray(data.equipment) ? data.equipment : []);
            setForm((previous) => ({
                ...previous,
                addressId: String(address.houseId),
                // Квартира берётся именно из блока address ответа create-form.
                apartment: address.apartment == null ? "" : String(address.apartment),
            }));
        } catch (e) {
            console.error("Ошибка загрузки формы заявки:", e);
            setError(
                e.message ||
                "Не удалось загрузить данные для создания заявки."
            );
        } finally {
            setFormDataLoading(false);
        }
    };

    const handleCreate = async () => {
        setCreateError("");
        setCreateFieldErrors({});
        setSuccess("");

        const validationErrors = {};
        if (!form.addressId) validationErrors.addressId = "Выберите адрес обслуживания.";
        if (!form.equipmentId) validationErrors.equipmentId = "Выберите оборудование для заявки.";
        if (form.problemDescription.trim().length < 5) {
            validationErrors.problemDescription = "Описание проблемы должно содержать минимум 5 символов.";
        }

        if (form.preferredVisitAt) {
            const visitDate = new Date(form.preferredVisitAt);
            if (Number.isNaN(visitDate.getTime())) {
                validationErrors.preferredVisitAt = "Укажите корректную дату и время визита.";
            } else if (visitDate.getTime() <= Date.now()) {
                validationErrors.preferredVisitAt = "Выберите дату и время в будущем либо оставьте поле пустым.";
            }
        }

        if (Object.keys(validationErrors).length > 0) {
            setCreateFieldErrors(validationErrors);
            return;
        }

        const apartment = createAddress?.apartment == null
            ? null
            : String(createAddress.apartment).trim() || null;

        const payload = {
            addressId: form.addressId,
            apartment,
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

            const data = e?.response?.data;
            const backendErrors = data?.validationErrors || data?.errors;
            const fieldMap = {
                addressId: "addressId",
                equipmentId: "equipmentId",
                problemDescription: "problemDescription",
                clientComment: "clientComment",
                preferredVisitAt: "preferredVisitAt",
                apartment: "apartment",
            };
            const mappedErrors = {};

            if (backendErrors && typeof backendErrors === "object") {
                Object.entries(backendErrors).forEach(([field, message]) => {
                    const mappedField = fieldMap[field] || fieldMap[field?.toLowerCase()];
                    const text = Array.isArray(message) ? message.join("; ") : String(message || "");
                    if (mappedField) mappedErrors[mappedField] = text;
                });
            }

            const rawMessage = String(data?.message || data?.detail || e?.message || "").toLowerCase();
            if (!mappedErrors.preferredVisitAt && (
                rawMessage.includes("preferredvisitat") ||
                rawMessage.includes("visit") ||
                rawMessage.includes("время") ||
                rawMessage.includes("дат") ||
                rawMessage.includes("future")
            )) {
                mappedErrors.preferredVisitAt = "Некорректная дата или время визита. Выберите дату и время в будущем либо оставьте поле пустым.";
            }
            if (!mappedErrors.equipmentId && (rawMessage.includes("equipment") || rawMessage.includes("оборудован"))) {
                mappedErrors.equipmentId = "Оборудование не выбрано или недоступно. Проверьте выбранное оборудование.";
            }
            if (!mappedErrors.addressId && (rawMessage.includes("address") || rawMessage.includes("адрес"))) {
                mappedErrors.addressId = "Адрес обслуживания не выбран или недоступен. Проверьте адрес.";
            }
            if (!mappedErrors.problemDescription && (rawMessage.includes("problemdescription") || rawMessage.includes("description") || rawMessage.includes("описан"))) {
                mappedErrors.problemDescription = "Описание проблемы должно содержать минимум 5 символов.";
            }

            if (Object.keys(mappedErrors).length > 0) {
                setCreateFieldErrors(mappedErrors);
                setCreateError("Проверьте поля, отмеченные ниже.");
            } else {
                setCreateError(data?.message || data?.detail || "Не удалось создать заявку. Проверьте данные и попробуйте ещё раз.");
            }
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
                                    onClick={() => openRequest(request)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openRequest(request);
                                        }
                                    }}
                                    sx={{
                                        borderRadius: 3,
                                        cursor: "pointer",
                                        transition: "box-shadow .2s, transform .2s",
                                        "&:hover": { boxShadow: 5, transform: "translateY(-1px)" },
                                        "&:focus-visible": {
                                            outline: "2px solid",
                                            outlineColor: "primary.main",
                                            outlineOffset: 2,
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }}
                                            justifyContent="space-between"
                                            alignItems={{ xs: "flex-start", sm: "center" }}
                                            spacing={2}
                                        >
                                            <Stack spacing={1.25} sx={{ minWidth: 0, flex: 1 }}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    flexWrap="wrap"
                                                >
                                                    <Typography fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                                                        Заявка № {String(request.requestNumber ?? request.number ?? request.id).slice(0, 8)}
                                                    </Typography>
                                                    <Chip
                                                        label={info.label}
                                                        color={info.color}
                                                        size="small"
                                                    />
                                                </Stack>

                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <AccessTimeIcon fontSize="small" color="action" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Создана: {formatDate(request.createdAt)}
                                                    </Typography>
                                                </Stack>
                                            </Stack>

                                        </Stack>

                                        <Divider sx={{ my: 2 }} />
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
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
                                                    backgroundColor: "background.default",
                                                    p: { xs: 1.5, md: 2 },
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <RequestWorkflow status={request.status} />
                                            </Box>
                                            <Box
                                                sx={{
                                                    minWidth: { xs: "auto", md: 180 },
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    px: { xs: 0, md: 1 },
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    color="primary.main"
                                                    fontWeight={600}
                                                    sx={{ textAlign: "center" }}
                                                >
                                                    Нажмите, чтобы открыть
                                                </Typography>
                                            </Box>
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
                        {createError && (
                            <Alert severity="error" onClose={() => setCreateError("")}>
                                {createError}
                            </Alert>
                        )}
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
                                createAddress?.cityName || createAddress?.city?.name || createAddress?.city || "Не указан"
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
                                createAddress?.streetName || createAddress?.street?.name || createAddress?.street || "Не указана"
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
                            value={
                                createAddress?.houseNumber ||
                                createAddress?.house?.number ||
                                createAddress?.house?.houseNumber ||
                                createAddress?.house?.name ||
                                (createAddress?.houseId != null ? `Дом ${createAddress.houseId}` : "Не указан")
                            }
                            slotProps={{ input: { readOnly: true } }}
                            sx={{
                                "& .MuiInputBase-root": { backgroundColor: "#F3F4F6" },
                                "& .MuiInputBase-input": { color: "#6B7280", cursor: "default" },
                            }}
                            helperText={
                                createAddress?.houseId != null
                                    ? "Адрес получен из Request Service."
                                    : "Адрес не получен. Проверьте данные профиля."
                            }
                        />

                        <TextField
                            label="Квартира"
                            fullWidth
                            value={form.apartment || "Не указана"}
                            slotProps={{ input: { readOnly: true } }}
                            sx={{
                                "& .MuiInputBase-root": { backgroundColor: "#F3F4F6" },
                                "& .MuiInputBase-input": { color: "#6B7280", cursor: "default" },
                            }}
                            helperText="Квартира подставлена из адреса, полученного от Request Service."
                        />

                        <TextField
                            select
                            label="Оборудование"
                            required
                            fullWidth
                            value={form.equipmentId}
                            disabled={formDataLoading}
                            error={Boolean(createFieldErrors.equipmentId)}
                            onChange={(event) => {
                                setCreateFieldErrors((previous) => ({ ...previous, equipmentId: "" }));
                                setCreateError("");
                                setForm((previous) => ({
                                    ...previous,
                                    equipmentId: event.target.value,
                                }));
                            }}
                            helperText={createFieldErrors.equipmentId || "Обязательно. Если оборудование не отображается, проверьте его наличие в профиле/адресе."}
                        >
                            <MenuItem value="" disabled>Выберите оборудование</MenuItem>
                            {equipment.map((item) => (
                                <MenuItem key={item.id} value={String(item.id)}>
                                    {[
                                        item.equipmentTypeName || item.typeName,
                                        item.model,
                                    ].filter(Boolean).join(" ") || `Оборудование ${String(item.id).slice(0, 8)}`}
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
                            error={Boolean(createFieldErrors.problemDescription)}
                            helperText={createFieldErrors.problemDescription || `${form.problemDescription.length}/5000. Минимум 5 символов: опишите неисправность и что происходит.`}
                            onChange={(event) => {
                                setCreateFieldErrors((previous) => ({ ...previous, problemDescription: "" }));
                                setCreateError("");
                                setForm((previous) => ({
                                    ...previous,
                                    problemDescription: event.target.value,
                                }));
                            }}
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
                            onChange={(event) => {
                                setCreateError("");
                                setForm((previous) => ({
                                    ...previous,
                                    clientComment: event.target.value,
                                }));
                            }}
                        />

                        <TextField
                            label="Желаемое время визита"
                            type="datetime-local"
                            fullWidth
                            value={form.preferredVisitAt}
                            error={Boolean(createFieldErrors.preferredVisitAt)}
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
                            onChange={(event) => {
                                setCreateFieldErrors((previous) => ({ ...previous, preferredVisitAt: "" }));
                                setCreateError("");
                                setForm((previous) => ({
                                    ...previous,
                                    preferredVisitAt: event.target.value,
                                }));
                            }}
                            helperText={createFieldErrors.preferredVisitAt || "Необязательно. Если указали дату, она должна быть в будущем. Прошедшее время backend отклонит."}
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
                            form.problemDescription.trim().length < 5 ||
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
                onEdit={() => openEditDialog(selectedRequest)}
                onCancel={() => setCancelTarget(selectedRequest)}
                busy={editing || cancelling}
            />

            {/* Редактирование заявки */}
            <Dialog
                open={editOpen}
                onClose={() => !editing && setEditOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Typography variant="h6" fontWeight={800}>
                        Редактирование заявки № {selectedRequest?.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Изменить описание, комментарий и желаемое время визита можно до принятия заявки мастером.
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        {createError && (
                            <Alert severity="error" onClose={() => setCreateError("")}>
                                {createError}
                            </Alert>
                        )}
                        {editError && (
                            <Alert severity="error" onClose={() => setEditError("")}>
                                {editError}
                            </Alert>
                        )}

                        <TextField
                            label="Описание проблемы"
                            required
                            multiline
                            minRows={3}
                            maxRows={8}
                            fullWidth
                            value={editForm.problemDescription}
                            inputProps={{ maxLength: 5000 }}
                            error={Boolean(editError) && editForm.problemDescription.trim().length < 5}
                            helperText={`${editForm.problemDescription.length}/5000. Минимум 5 символов.`}
                            onChange={(event) => {
                                setEditError("");
                                setEditForm((previous) => ({
                                    ...previous,
                                    problemDescription: event.target.value,
                                }));
                            }}
                        />

                        <TextField
                            label="Комментарий"
                            multiline
                            minRows={2}
                            maxRows={5}
                            fullWidth
                            value={editForm.clientComment}
                            inputProps={{ maxLength: 2000 }}
                            helperText={`${editForm.clientComment.length}/2000`}
                            onChange={(event) => {
                                setEditError("");
                                setEditForm((previous) => ({
                                    ...previous,
                                    clientComment: event.target.value,
                                }));
                            }}
                        />

                        <TextField
                            label="Желаемое время визита"
                            type="datetime-local"
                            fullWidth
                            value={editForm.preferredVisitAt}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: {
                                    min: new Date(
                                        Date.now() - new Date().getTimezoneOffset() * 60000
                                    ).toISOString().slice(0, 16),
                                },
                            }}
                            onChange={(event) => {
                                setEditError("");
                                setEditForm((previous) => ({
                                    ...previous,
                                    preferredVisitAt: event.target.value,
                                }));
                            }}
                            helperText="Необязательно. Новая дата и время должны быть в будущем; прошедшее время backend отклонит."
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => {
                            setEditError("");
                            setEditOpen(false);
                        }}
                        disabled={editing}
                    >
                        Отмена
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleEdit}
                        disabled={editing || editForm.problemDescription.trim().length < 5}
                        startIcon={editing ? <CircularProgress size={18} /> : <EditOutlinedIcon />}
                    >
                        {editing ? "Сохранение..." : "Сохранить изменения"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Подтверждение отмены заявки */}
            <Dialog
                open={Boolean(cancelTarget)}
                onClose={() => !cancelling && setCancelTarget(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Отменить заявку?</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">
                        Вы действительно хотите отменить заявку № {cancelTarget?.id}? Это действие изменит её статус.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCancelTarget(null)} disabled={cancelling}>
                        Не отменять
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleCancelRequest}
                        disabled={cancelling}
                        startIcon={cancelling ? <CircularProgress size={18} /> : <CancelOutlinedIcon />}
                    >
                        {cancelling ? "Отмена..." : "Да, отменить"}
                    </Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
}
