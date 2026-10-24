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
    Radio,
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
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";

import {
    getAllRequests,
    getRequestById,
    getAssignmentCandidates,
    assignMaster,
    adminCancelRequest,
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
        description: "Для заявки необходимо назначить мастера.",
    },
    ASSIGNED: {
        label: "Мастер назначен",
        color: "primary",
        description: "Заявка назначена мастеру и ожидает его решения.",
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

const FILTERS = [
    { value: "ALL", label: "Все заявки" },
    {
        value: "WAITING_FOR_ASSIGNMENT",
        label: "Ожидают назначения",
    },
    { value: "ASSIGNED", label: "Мастер назначен" },
    { value: "ACCEPTED", label: "Приняты мастером" },
    { value: "IN_PROGRESS", label: "В работе" },
    { value: "REPORT_SUBMITTED", label: "Отчёт отправлен" },
    { value: "REVISION_REQUIRED", label: "Требуют доработки" },
    { value: "COMPLETED", label: "Завершённые" },
    { value: "REJECTED", label: "Отклонённые" },
    { value: "CANCELLED", label: "Отменённые" },
];

const ASSIGNABLE_STATUSES = [
    "WAITING_FOR_ASSIGNMENT",
    "ASSIGNED",
];

const CANCELLABLE_STATUSES = [
    "NEW",
    "WAITING_FOR_ASSIGNMENT",
    "ASSIGNED",
    "ACCEPTED",
    "IN_PROGRESS",
    "REPORT_SUBMITTED",
    "REVISION_REQUIRED",
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

/**
 * Визуальная цепочка прохождения заявки.
 * Статусы берутся из фактического поля request.status.
 */
function workflowIndex(status) {
    if (status === "REVISION_REQUIRED") return 5;
    if (status === "CANCELLED" || status === "REJECTED") return -1;

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
                    "& .MuiStepLabel-label": { fontSize: compact ? 10 : 12 },
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

    return (
        name ||
        (person.masterId
            ? `Мастер #${person.masterId}`
            : fallback)
    );
}

function getReadableAddress(request) {
    const address = request?.address;

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
        ].filter(
            (part) => part && typeof part !== "object"
        );

        if (parts.length) {
            return parts.join(", ");
        }
    }

    if (typeof address === "string" && address.trim()) {
        return [
            address.trim(),
            apartment,
        ]
            .filter(Boolean)
            .join(", ");
    }

    const fallback = request?.addressId
        ? `ID адреса: ${request.addressId}`
        : "Адрес не предоставлен backend";

    return [
        fallback,
        apartment,
    ]
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
        equipment.equipmentTypeName || equipment.typeName,
        equipment.model,
        equipment.serialNumber
            ? `№ ${equipment.serialNumber}`
            : null,
    ]
        .filter(Boolean)
        .join(" ") || "Оборудование не предоставлено backend";
}

function getAssignmentErrorMessage(error) {
    const status = error?.status;

    const rawMessage = String(
        error?.message || ""
    ).toLowerCase();

    if (status === 400 || rawMessage.includes("специализац")) {
        return "Нельзя назначить этого мастера: его специализация не соответствует оборудованию заявки.";
    }

    if (status === 403) {
        return "Недостаточно прав для назначения мастера.";
    }

    if (status === 404) {
        return "Заявка или оборудование не найдены. Обновите список заявок.";
    }

    if (status === 409) {
        return "Назначение невозможно на текущем этапе заявки. Обновите карточку и проверьте её статус.";
    }

    if (error?.isNetworkError) {
        return "Не удалось связаться с сервером. Проверьте подключение и повторите запрос.";
    }

    return (
        error?.message ||
        "Не удалось выполнить действие. Попробуйте ещё раз."
    );
}

function getMasterId(master) {
    return master?.masterId ?? master?.id ?? null;
}

function MasterName({ master }) {
    if (!master) {
        return (
            <Typography color="text.secondary">
                Пока не назначен
            </Typography>
        );
    }

    return (
        <Stack spacing={0.25}>
            <Typography fontWeight={600}>
                {getPersonName(master)}
            </Typography>

            {master.phone && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {master.phone}
                </Typography>
            )}
        </Stack>
    );
}

/**
 * Диалог карточки заявки.
 */
function RequestDetailsDialog({
    request,
    loading,
    error,
    userRole,
    onClose,
    onAssign,
    onCancelRequest,
    busy,
}) {
    if (!request) {
        return null;
    }

    const info = statusInfo(request.status);

    const canManage =
        userRole === "ADMIN" ||
        userRole === "DISPATCHER";

    const canAssign =
        canManage &&
        ASSIGNABLE_STATUSES.includes(request.status);

    const canCancel =
        canManage &&
        CANCELLABLE_STATUSES.includes(request.status);

    const master =
        request.master ||
        (request.masterName
            ? { name: request.masterName }
            : null);

    return (
        <Dialog
            open
            onClose={() => !busy && onClose()}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
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

            <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 3, bgcolor: "grey.50" }}>
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
                                onClick={() => onAssign("reload")}
                            >
                                Повторить
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                ) : (
                    <Stack spacing={2.5}>
                <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: { xs: 1.75, sm: 2.5 } }}>
                    <Typography variant="subtitle1" fontWeight={800} mb={2}>Информация о заявке</Typography>
                    <Grid container spacing={2.25}>
                        {[
                            ["Клиент", getPersonName(
                                request.client || request.clientInfo || {
                                    lastName: request.clientLastName,
                                    firstName: request.clientFirstName,
                                    middleName: request.clientMiddleName,
                                },
                                "ФИО не указано"
                            )],
                            ["Дата создания", formatDate(request.createdAt)],
                            ["Желаемое время визита", request.preferredVisitAt ? formatDate(request.preferredVisitAt) : "Не указано"],
                            ["Адрес", getReadableAddress(request)],
                            ["Оборудование", getReadableEquipment(request)],
                            ["Мастер", master ? `${getPersonName(master)}${master.phone ? ` · Телефон: ${master.phone}` : ""}` : "Мастер не назначен"],
                        ].map(([label, value]) => (
                            <Grid item xs={12} sm={6} key={label}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</Typography>
                                <Typography variant="body1" fontWeight={label === "Клиент" ? 700 : 500} sx={{ overflowWrap: "anywhere", lineHeight: 1.5 }}>{value || "Не указано"}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: { xs: 1.75, sm: 2.5 } }}>
                    <Typography variant="subtitle1" fontWeight={800} mb={1}>Описание проблемы</Typography>
                    <Typography color={request.problemDescription ? "text.primary" : "text.secondary"} sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.7 }}>
                        {request.problemDescription || "Описание отсутствует"}
                    </Typography>
                </Box>

                <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: { xs: 1.5, sm: 2.5 } }}>
                    <Typography variant="subtitle1" fontWeight={800} mb={2}>Этапы заявки</Typography>
                    <RequestWorkflow status={request.status} />
                </Box>

                {!ASSIGNABLE_STATUSES.includes(request.status) && canManage && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        Назначение и переназначение мастера доступны только до принятия заявки мастером.
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
                    direction={{
                        xs: "column",
                        sm: "row",
                    }}
                    spacing={1}
                >
                    {canAssign && (
                        <Button
                            variant="contained"
                            startIcon={
                                request.status === "ASSIGNED"
                                    ? <SwapHorizIcon />
                                    : <EngineeringOutlinedIcon />
                            }
                            onClick={onAssign}
                            disabled={busy}
                            sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 700,
                                boxShadow: "none",
                            }}
                        >
                            {request.status === "WAITING_FOR_ASSIGNMENT"
                                ? "Назначить мастера"
                                : "Переназначить мастера"}
                        </Button>
                    )}

                    {canCancel && (
                        <Button
                            color="error"
                            variant="outlined"
                            startIcon={<CancelOutlinedIcon />}
                            onClick={onCancelRequest}
                            disabled={busy}
                            sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                            }}
                        >
                            Отменить заявку
                        </Button>
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

/**
 * Диалог выбора мастера.
 */
function MasterAssignmentDialog({
    open,
    request,
    candidates,
    selectedMasterId,
    loading,
    saving,
    error,
    onClose,
    onRetry,
    onSelectMaster,
    onConfirm,
}) {
    if (!request) {
        return null;
    }

    const isReassignment =
        request.status === "ASSIGNED";

    const selectedMaster = candidates.find(
        (candidate) =>
            String(getMasterId(candidate)) ===
            String(selectedMasterId)
    );

    const currentMaster =
        request.master ||
        (request.masterName
            ? { name: request.masterName }
            : request.masterId
                ? { masterId: request.masterId }
                : null);

    const selectedName = selectedMaster
        ? getPersonName(selectedMaster)
        : "";

    const currentName = getPersonName(
        currentMaster,
        "Мастер не назначен"
    );

    return (
        <Dialog
            open={open}
            onClose={() => !saving && onClose()}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 42,
                            height: 42,
                            flexShrink: 0,
                            borderRadius: 2,
                            color: "primary.main",
                            backgroundColor: "primary.50",
                        }}
                    >
                        {isReassignment
                            ? <SwapHorizIcon />
                            : <EngineeringOutlinedIcon />}
                    </Box>

                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={800}
                        >
                            {isReassignment
                                ? "Переназначение мастера"
                                : "Назначение мастера"}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
            Заявка №{" "}
            {String(
                request.requestNumber ??
                request.number ??
                request.id
            )}
        </Typography>
    </Box>
</Stack>
</DialogTitle>

<DialogContent dividers>
    <Stack spacing={2}>
        {isReassignment && (
            <Alert
                severity="info"
                icon={<SwapHorizIcon />}
            >
                Текущий мастер:{" "}
                <strong>{currentName}</strong>
                {currentMaster?.phone
                    ? ` · ${currentMaster.phone}`
                    : ""}
                . Выберите нового мастера ниже.
            </Alert>
        )}

        <Typography
            color="text.secondary"
            variant="body2"
        >
            Выберите мастера из списка подходящих по
            специализации. Количество активных заявок
            показывает текущую нагрузку и не ограничивает
            назначение.
        </Typography>

        {error && (
            <Alert
                severity="error"
                action={
                    <Button
                        color="inherit"
                        size="small"
                        onClick={onRetry}
                        disabled={loading || saving}
                        sx={{ textTransform: "none" }}
                    >
                        Повторить
                    </Button>
                }
            >
                {error}
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
                <Stack
                    alignItems="center"
                    spacing={1.5}
                >
                    <CircularProgress size={30} />

                    <Typography
                        color="text.secondary"
                        variant="body2"
                    >
                        Загружаем подходящих мастеров...
                    </Typography>
                </Stack>
    </Box>
) : error ? null : candidates.length === 0 ? (
    <Box
        sx={{
            textAlign: "center",
            py: 4,
        }}
    >
        <EngineeringOutlinedIcon
            sx={{
                fontSize: 42,
                color: "text.disabled",
                mb: 1,
            }}
        />

        <Typography fontWeight={700}>
            Подходящие мастера не найдены
        </Typography>

        <Typography
            color="text.secondary"
            variant="body2"
            sx={{ mt: 0.5 }}
        >
            Проверьте специализации мастеров и
            попробуйте обновить список.
        </Typography>

        <Button
            onClick={onRetry}
            sx={{
                mt: 1.5,
                textTransform: "none",
            }}
        >
            Повторить поиск
        </Button>
    </Box>
) : (
    <Stack
        spacing={1.25}
        sx={{
            maxHeight: 360,
            overflowY: "auto",
            pr: 0.5,
        }}
    >
        {candidates.map((master) => {
            const id = getMasterId(master);

            if (id == null) {
                return null;
            }

            const checked =
                String(selectedMasterId) === String(id);

            const name = getPersonName(
                master,
                "Мастер без ФИО"
            );

            const isCurrent =
                currentMaster &&
                String(
                    getMasterId(currentMaster) ??
                    currentMaster.masterId
                ) === String(id);

            return (
                <Card
                    key={String(id)}
                    variant="outlined"
                    onClick={() => onSelectMaster(String(id))}
                    sx={{
                        borderRadius: 2.5,
                        cursor: saving
                            ? "default"
                            : "pointer",
                        borderColor: checked
                            ? "primary.main"
                            : "divider",
                        backgroundColor: checked
                            ? "primary.50"
                            : "background.paper",
                        boxShadow: checked ? 1 : 0,
                        transition: "all .15s ease",
                        "&:hover": saving
                            ? {}
                            : {
                                borderColor: "primary.main",
                                backgroundColor: "action.hover",
                            },
                    }}
                >
                    <CardContent
                        sx={{
                            p: 2,
                            "&:last-child": {
                                pb: 2,
                            },
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                        >
                            <Radio
                                checked={checked}
                                onChange={() =>
                                    onSelectMaster(String(id))
                                }
                                disabled={saving}
                                inputProps={{
                                    "aria-label": name,
                                }}
                            />

                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: "50%",
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "primary.main",
                                    backgroundColor: checked
                                        ? "primary.100"
                                        : "action.hover",
                                }}
                            >
                                <PersonOutlineOutlinedIcon />
                            </Box>

                            <Box
                                sx={{
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                <Stack
                                    direction={{
                                        xs: "column",
                                        sm: "row",
                                    }}
                                    alignItems={{
                                        xs: "flex-start",
                                        sm: "center",
                                    }}
                                    spacing={0.75}
                                    flexWrap="wrap"
                                >
                                    <Typography
                                        fontWeight={700}
                                        sx={{
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {name}
                                    </Typography>

                                    {isCurrent && (
                                        <Chip
                                            label="Текущий мастер"
                                            size="small"
                                            color="default"
                                            variant="outlined"
                                        />
                                    )}

                                    {checked && (
                                        <Chip
                                            label="Выбран"
                                            size="small"
                                            color="primary"
                                        />
                                    )}
                                </Stack>

                                <Stack
                                    direction={{
                                        xs: "column",
                                        sm: "row",
                                    }}
                                    spacing={{
                                        xs: 0.5,
                                        sm: 2,
                                    }}
                                    sx={{ mt: 0.75 }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={0.75}
                                        alignItems="center"
                                    >
                                        <PhoneOutlinedIcon
                                            sx={{
                                                fontSize: 16,
                                                color: "text.secondary",
                                            }}
                                        />

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {master.phone ||
                                                "Телефон не указан"}
                                        </Typography>
                                    </Stack>

                                    <Stack
                                        direction="row"
                                        spacing={0.75}
                                        alignItems="center"
                                    >
                                        <WorkOutlineOutlinedIcon
                                            sx={{
                                                fontSize: 16,
                                                color: "text.secondary",
                                            }}
                                        />

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Активных заявок:{" "}
                                            {master.activeRequestsCount ?? 0}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Box>
        </Stack>
    </CardContent>
</Card>
);
})}
</Stack>
)}

        {!loading && !error && selectedMaster && (
            <Alert
                severity="info"
                icon={<CheckCircleOutlineIcon />}
            >
                {isReassignment
                    ? `Переназначить заявку с мастера «${currentName}» на «${selectedName}»?`
                    : `Назначить мастера «${selectedName}» на заявку №${String(
                        request.requestNumber ??
                        request.number ??
                        request.id
                    )}?`}
            </Alert>
        )}
    </Stack>
</DialogContent>

<DialogActions
    sx={{
        p: 2,
        gap: 1,
    }}
>
    <Button
        onClick={onClose}
        disabled={saving}
        sx={{ textTransform: "none" }}
    >
        Отмена
    </Button>

    <Button
        variant="contained"
        onClick={onConfirm}
        disabled={
            loading ||
            saving ||
            Boolean(error) ||
            !selectedMaster
        }
        startIcon={
            saving
                ? <CircularProgress size={18} color="inherit" />
                : <CheckCircleOutlineIcon />
        }
        sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
        }}
    >
        {saving
            ? "Сохранение..."
            : isReassignment
                ? "Подтвердить переназначение"
                : "Подтвердить назначение"}
    </Button>
</DialogActions>
</Dialog>
);
}

/**
 * Основная страница управления заявками.
 */
export default function RequestManagementPage() {
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

    const [assignmentOpen, setAssignmentOpen] = useState(false);

    const [candidates, setCandidates] = useState([]);
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [candidatesError, setCandidatesError] = useState("");

    const [selectedMasterId, setSelectedMasterId] = useState("");
    const [assignmentSaving, setAssignmentSaving] = useState(false);

    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    const isManager =
        user?.role === "ADMIN" ||
        user?.role === "DISPATCHER";

    /**
     * Загрузка заявок.
     */
    const loadRequests = useCallback(
        async (isRefresh = false) => {
            setError("");

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const data = await getAllRequests();

                if (!Array.isArray(data)) {
                    throw new Error(
                        "Не удалось получить список заявок."
                    );
                }

                setRequests(data);
            } catch (requestError) {
                setError(
                    getAssignmentErrorMessage(requestError)
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    /**
     * Получение текущего пользователя.
     */
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

            if (
                !profile ||
                !["ADMIN", "DISPATCHER"].includes(profile.role)
            ) {
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

    /**
     * Поиск и сортировка заявок.
     */
    const filteredRequests = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase();

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
                const aPriority =
                    a.status === "WAITING_FOR_ASSIGNMENT"
                        ? 0
                        : a.status === "ASSIGNED"
                            ? 1
                            : 2;

                const bPriority =
                    b.status === "WAITING_FOR_ASSIGNMENT"
                        ? 0
                        : b.status === "ASSIGNED"
                            ? 1
                            : 2;

                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }

                return (
                    new Date(b.createdAt || 0) -
                    new Date(a.createdAt || 0)
                );
            });
    }, [requests, search, filter]);

    /**
     * Счётчики заявок.
     */
    const stats = useMemo(
        () => ({
            total: requests.length,

            waiting: requests.filter(
                (request) =>
                    request.status === "WAITING_FOR_ASSIGNMENT"
            ).length,

            assigned: requests.filter(
                (request) =>
                    request.status === "ASSIGNED"
            ).length,
        }),
        [requests]
    );

    /**
     * Открытие карточки заявки.
     */
    const openRequest = async (request) => {
        setSelectedRequest(request);

        setDetails(null);
        setDetailsError("");
        setDetailsLoading(true);

        setSuccess("");
        setError("");

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
                    ? {
                        ...previous,
                        ...data,
                    }
                    : previous
            );
        } catch (requestError) {
            setDetailsError(
                getAssignmentErrorMessage(requestError)
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    /**
     * Закрытие карточки заявки.
     */
    const closeRequestDetails = () => {
        if (assignmentSaving || cancelling) {
            return;
        }

        setSelectedRequest(null);
        setDetails(null);
        setDetailsError("");
        setAssignmentOpen(false);
    };

    /**
     * Получение списка мастеров-кандидатов.
     */
    const loadCandidates = async (requestId) => {
        if (!requestId) {
            return;
        }

        setCandidates([]);
        setSelectedMasterId("");
        setCandidatesError("");
        setCandidatesLoading(true);

        try {
            const data = await getAssignmentCandidates(
                requestId
            );

            if (!Array.isArray(data)) {
                throw new Error(
                    "Сервер вернул некорректный список мастеров."
                );
            }

            setCandidates(data);
        } catch (requestError) {
            setCandidatesError(
                getAssignmentErrorMessage(requestError)
            );
        } finally {
            setCandidatesLoading(false);
        }
    };

    /**
     * Открытие интерфейса назначения.
     */
    const openAssignmentDialog = async () => {
        const request = details;

        if (
            !request ||
            !isManager ||
            !ASSIGNABLE_STATUSES.includes(request.status)
        ) {
            return;
        }

        setAssignmentOpen(true);
        setSuccess("");

        await loadCandidates(request.id);
    };

    /**
     * Повторная загрузка кандидатов.
     */
    const retryLoadCandidates = () => {
        if (details?.id) {
            loadCandidates(details.id);
        }
    };

    /**
     * Назначение или переназначение мастера.
     */
    const handleAssignMaster = async () => {
        if (
            !details ||
            !selectedMasterId ||
            !isManager
        ) {
            return;
        }

        const selectedMaster = candidates.find(
            (candidate) =>
                String(getMasterId(candidate)) ===
                String(selectedMasterId)
        );

        if (!selectedMaster) {
            setCandidatesError(
                "Выбранный мастер больше не доступен. Обновите список и выберите его заново."
            );

            return;
        }

        const selectedName = getPersonName(
            selectedMaster
        );

        const currentMaster =
            details.master ||
            (details.masterName
                ? { name: details.masterName }
                : details.masterId
                    ? { masterId: details.masterId }
                    : null);

        const confirmationText =
            details.status === "ASSIGNED"
                ? `Переназначить заявку с мастера «${getPersonName(
                    currentMaster,
                    "Не назначен"
                )}» на «${selectedName}»?`
                : `Назначить мастера «${selectedName}» на заявку №${String(
                    details.requestNumber ??
                    details.number ??
                    details.id
                )}?`;

        /**
         * Запрос назначения отправляется
         * только после подтверждения.
         */
        if (!window.confirm(confirmationText)) {
            return;
        }

        setAssignmentSaving(true);
        setCandidatesError("");
        setError("");
        setSuccess("");

        try {
            /**
             * UUID передаётся строкой.
             * Не преобразовывать masterId в Number.
             */
            await assignMaster(
                details.id,
                selectedMasterId
            );

            setAssignmentOpen(false);
            setCandidates([]);
            setSelectedMasterId("");

            setSuccess(
                details.status === "ASSIGNED"
                    ? `Мастер ${selectedName} успешно назначен вместо предыдущего.`
                    : `Мастер ${selectedName} успешно назначен на заявку №${String(
                        details.requestNumber ??
                        details.number ??
                        details.id
                    )}.`
            );

            /**
             * Обновление карточки заявки
             * после успешного назначения.
             */
            const refreshedDetails =
                await getRequestById(details.id);

            setDetails(refreshedDetails);

            setSelectedRequest((previous) =>
                previous?.id === details.id
                    ? {
                        ...previous,
                        ...refreshedDetails,
                    }
                    : previous
            );

            /**
             * Обновление списка заявок.
             */
            await loadRequests(true);
        } catch (requestError) {
            setCandidatesError(
                getAssignmentErrorMessage(requestError)
            );
        } finally {
            setAssignmentSaving(false);
        }
    };

    /**
     * Открытие подтверждения отмены.
     */
    const openCancelConfirmation = () => {
        if (
            !details ||
            !isManager ||
            !CANCELLABLE_STATUSES.includes(details.status)
        ) {
            return;
        }

        setCancelTarget(details);
    };

    /**
     * Отмена заявки администратором или диспетчером.
     */
    const handleCancelRequest = async () => {
        if (!cancelTarget || !isManager) {
            return;
        }

        setCancelling(true);
        setError("");
        setSuccess("");

        try {
            await adminCancelRequest(cancelTarget.id);

            setCancelTarget(null);

            setSuccess(
                `Заявка №${String(
                    cancelTarget.requestNumber ??
                    cancelTarget.number ??
                    cancelTarget.id
                )} отменена.`
            );

            const refreshedDetails =
                await getRequestById(cancelTarget.id);

            setDetails(refreshedDetails);

            setSelectedRequest((previous) =>
                previous?.id === cancelTarget.id
                    ? {
                        ...previous,
                        ...refreshedDetails,
                    }
                    : previous
            );

            await loadRequests(true);
        } catch (requestError) {
            setError(
                getAssignmentErrorMessage(requestError)
            );
        } finally {
            setCancelling(false);
        }
    };

    /**
     * Закрытие диалога назначения.
     */
    const closeAssignmentDialog = () => {
        if (assignmentSaving) {
            return;
        }

        setAssignmentOpen(false);
        setCandidatesError("");
    };

    /**
     * Загрузка пользователя.
     */
    if (
        profileLoading ||
        (loading && !user && !error)
    ) {
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

    /**
     * Защита от доступа клиента или мастера.
     */
    if (!user || !isManager) {
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
                            "У вас нет доступа к управлению заявками. Эта страница доступна только диспетчеру и администратору."}
                    </Alert>
                </Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout user={user}>
            <Box sx={{ maxWidth: 1440, mx: "auto" }}>
                {/* Заголовок страницы */}
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
                            Управление заявками
                        </Typography>

                        <Typography
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                        >
                            Назначение и переназначение мастеров,
                            а также контроль заявок.
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
                            fontSize: 14,
                            color: "#2563EB",
                            borderColor: "#BFDBFE",
                            backgroundColor: "#FFFFFF",
                            whiteSpace: "nowrap",
                            boxShadow: "none",
                            "& .MuiButton-startIcon": {
                                marginRight: 0.7,
                            },
                            "&:hover": {
                                borderColor: "#93C5FD",
                                backgroundColor: "#EFF6FF",
                                boxShadow: "none",
                            },
                        }}
                    >
                        {refreshing
                            ? "Обновление..."
                            : "Обновить"}
                    </Button>
                </Box>

                {/* Уведомления */}
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
                <Grid
                    container
                    spacing={2}
                    sx={{ mb: 3 }}
                >
                    {[
                        {
                            label: "Всего заявок",
                            value: stats.total,
                            color: "#2563EB",
                        },
                        {
                            label: "Ожидают назначения",
                            value: stats.waiting,
                            color: "#D97706",
                        },
                        {
                            label: "Мастер назначен",
                            value: stats.assigned,
                            color: "#16A34A",
                        },
                    ].map((item) => (
                        <Grid
                            key={item.label}
                            size={{ xs: 12, sm: 4 }}
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
                <Card
                    sx={{
                        borderRadius: 3,
                        mb: 3,
                    }}
        >
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
                            Откройте карточку заявки, чтобы
                            просмотреть детали и при необходимости
                            назначить мастера.
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
                            ? "Когда появятся новые заявки, они отобразятся здесь."
                            : "Попробуйте изменить поисковый запрос или фильтр."}
                    </Typography>
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
                        transition: "box-shadow .2s, transform .2s",
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
                                            overflowWrap: "anywhere",
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
                                        {formatDate(request.createdAt)}
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
                                    backgroundColor: "background.default",
                                    p: { xs: 1.25, md: 1.5 },
                                    overflow: "hidden",
                                }}
                            >
                                <RequestWorkflow status={request.status} compact />
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
                                    sx={{ textAlign: "center" }}
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
    userRole={user?.role}
    onClose={closeRequestDetails}
    onAssign={(action) =>
        action === "reload"
            ? openRequest(selectedRequest)
            : openAssignmentDialog()
    }
    onCancelRequest={openCancelConfirmation}
    busy={assignmentSaving || cancelling}
/>

{/* Выбор мастера */}
<MasterAssignmentDialog
    open={assignmentOpen}
    request={details}
    candidates={candidates}
    selectedMasterId={selectedMasterId}
    loading={candidatesLoading}
    saving={assignmentSaving}
    error={candidatesError}
    onClose={closeAssignmentDialog}
    onRetry={retryLoadCandidates}
    onSelectMaster={setSelectedMasterId}
    onConfirm={handleAssignMaster}
/>

{/* Подтверждение отмены */}
<Dialog
    open={Boolean(cancelTarget)}
    onClose={() =>
        !cancelling && setCancelTarget(null)
    }
    maxWidth="xs"
    fullWidth
>
    <DialogTitle fontWeight={800}>
        Отменить заявку?
    </DialogTitle>

    <DialogContent dividers>
        <Typography color="text.secondary">
            Вы действительно хотите отменить заявку №{" "}
            {String(cancelTarget?.id || "")}?
        </Typography>
    </DialogContent>

    <DialogActions sx={{ p: 2 }}>
        <Button
            onClick={() => setCancelTarget(null)}
            disabled={cancelling}
            sx={{ textTransform: "none" }}
        >
            Не отменять
        </Button>

        <Button
            color="error"
            variant="contained"
            onClick={handleCancelRequest}
            disabled={cancelling}
            startIcon={
                cancelling
                    ? <CircularProgress size={18} />
                    : <CancelOutlinedIcon />
            }
        >
            {cancelling
                ? "Отмена..."
                : "Да, отменить"}
        </Button>
    </DialogActions>
</Dialog>
</Box>
</MainLayout>
);
}