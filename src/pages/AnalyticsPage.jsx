
import { useCallback, useEffect, useMemo, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from "@mui/material";

import ShowChartIcon from "@mui/icons-material/ShowChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupsIcon from "@mui/icons-material/Groups";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import MainLayout from "../components/layout/MainLayout";

import { getCurrentProfile } from "../api/userApi";
import { getAnalytics } from "../api/analyticsApi";
import { getAllZones } from "../api/zoneApi";
import { getUsersByRole } from "../api/adminUserApi";

const STATUS_META = {
    NEW: {
        label: "Новые",
        color: "#64748b",
    },
    WAITING_FOR_ASSIGNMENT: {
        label: "Ожидают назначения",
        color: "#f59e0b",
    },
    ASSIGNED: {
        label: "Назначены",
        color: "#8b5cf6",
    },
    IN_PROGRESS: {
        label: "В работе",
        color: "#2563eb",
    },
    REPORT_SUBMITTED: {
        label: "Отчёт отправлен",
        color: "#0891b2",
    },
    REVISION_REQUIRED: {
        label: "Требуют доработки",
        color: "#ea580c",
    },
    COMPLETED: {
        label: "Завершены",
        color: "#10b981",
    },
    CANCELLED: {
        label: "Отменены",
        color: "#ef4444",
    },
};

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getMasterName(master) {
    if (!master) return "Не назначен";

    const firstName = master.firstName || "";
    const lastName = master.lastName || "";
    const middleName = master.middleName || "";

    const fullName = [
        lastName,
        firstName,
        middleName,
    ].filter(Boolean).join(" ");

    return (
        fullName ||
        master.fullName ||
        master.fio ||
        master.name ||
        master.email ||
        "Мастер"
    );
}

function getZoneName(zone) {
    if (!zone) return "Неизвестная зона";

    return zone.name || zone.title || "Зона";
}

function MetricCard({
    title,
    value,
    description,
    icon,
    color,
    background,
}) {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                border: "1px solid #e5eaf2",
                borderRadius: 3,
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography fontSize={14} color="text.secondary">
                        {title}
                    </Typography>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            color,
                            bgcolor: background,
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>

                <Typography variant="h4" fontWeight={600} sx={{ mt: 1 }}>
                    {value}
                </Typography>

                <Typography
                    fontSize={12}
                    color="text.secondary"
                    sx={{ mt: 1 }}
                >
                    {description}
                </Typography>
            </CardContent>
        </Card>
    );
}

function ChartCard({ title, subtitle, children, sx = {} }) {
    return (
        <Card
            elevation={0}
            sx={{
                border: "1px solid #e5eaf2",
                borderRadius: 3,
                height: "100%",
                ...sx,
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Typography fontWeight={600}>
                    {title}
                </Typography>

                <Typography
                    fontSize={13}
                    color="text.secondary"
                    sx={{ mt: 0.5, mb: 2 }}
                >
                    {subtitle}
                </Typography>

                {children}
            </CardContent>
        </Card>
    );
}

function TrendChart({ trend }) {
    const points = useMemo(() => {
        return (trend || []).map((item) => ({
            date: item.date,
            received: Number(item.incoming || 0),
            completed: Number(item.completed || 0),
        }));
    }, [trend]);

    if (!points.length) {
        return (
            <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography color="text.secondary">
                    Нет данных за выбранный период
                </Typography>
            </Box>
        );
    }

    const width = 700;
    const height = 250;
    const left = 42;
    const right = 10;
    const top = 18;
    const bottom = 32;

    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    const maxValue = Math.max(
        1,
        ...points.map((point) =>
            Math.max(point.received, point.completed)
        )
    );

    const getX = (index) =>
        left +
        (
            points.length <= 1
                ? 0
                : (index / (points.length - 1)) * chartWidth
        );

    const getY = (value) =>
        top + chartHeight - (value / maxValue) * chartHeight;

    const makePath = (key) =>
        points
            .map(
                (point, index) =>
                    `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(point[key])}`
            )
            .join(" ");

    const formatLabel = (value) => {
        if (!value) return "";

        const date = new Date(`${value}T00:00:00`);

        return date.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
        });
    };

    const step = Math.max(1, Math.ceil(points.length / 8));

    const gridValues = [
        0,
        Math.ceil(maxValue / 3),
        Math.ceil((maxValue * 2) / 3),
        maxValue,
    ];

    return (
        <Box sx={{ width: "100%", overflow: "hidden" }}>
            <Stack
                direction="row"
                justifyContent="flex-end"
                spacing={2}
                sx={{ mb: 1 }}
            >
                <Stack direction="row" alignItems="center" spacing={0.7}>
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "#2563eb",
                        }}
                    />

                    <Typography fontSize={12}>
                        Поступило
                    </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.7}>
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "#10b981",
                        }}
                    />

                    <Typography fontSize={12}>
                        Завершено
                    </Typography>
                </Stack>
            </Stack>

            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Динамика заявок"
                style={{
                    width: "100%",
                    display: "block",
                }}
            >
                {gridValues.map((value, index) => (
                    <g key={`${value}-${index}`}>
                        <line
                            x1={left}
                            x2={width - right}
                            y1={getY(value)}
                            y2={getY(value)}
                            stroke="#dce5f1"
                            strokeDasharray="4 5"
                        />

                        <text
                            x={left - 10}
                            y={getY(value) + 4}
                            fontSize="10"
                            textAnchor="end"
                            fill="#64748b"
                        >
                            {value}
                        </text>
                    </g>
                ))}

                <path
                    d={makePath("received")}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                />

                <path
                    d={makePath("completed")}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                />

                {points.map((point, index) => (
                    <g key={point.date}>
                        <circle
                            cx={getX(index)}
                            cy={getY(point.received)}
                            r="3.5"
                            fill="#2563eb"
                        />

                        <circle
                            cx={getX(index)}
                            cy={getY(point.completed)}
                            r="3.5"
                            fill="#10b981"
                        />

                        {(
                            index % step === 0 ||
                            index === points.length - 1
                        ) && (
                            <text
                                x={getX(index)}
                                y={height - 8}
                                fontSize="10"
                                textAnchor="middle"
                                fill="#64748b"
                            >
                                {formatLabel(point.date)}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
        </Box>
    );
}

function StatusChart({ statuses }) {
    const counts = (statuses || []).map((item) => {
        const meta = STATUS_META[item.status] || {
            label: item.status,
            color: "#94a3b8",
        };

        return {
            status: item.status,
            label: meta.label,
            color: meta.color,
            count: Number(item.count || 0),
        };
    });

    const total = counts.reduce(
        (sum, item) => sum + item.count,
        0
    );

    let accumulated = 0;

    const gradient = counts
        .map((item) => {
            const start = accumulated;

            accumulated += total
                ? (item.count / total) * 100
                : 0;

            return `${item.color} ${start}% ${accumulated}%`;
        })
        .join(", ");

    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems="center"
            sx={{ py: 1 }}
        >
            <Box
                sx={{
                    width: 150,
                    height: 150,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: total
                        ? `conic-gradient(${gradient})`
                        : "#e5eaf2",
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <Box
                    sx={{
                        width: 104,
                        height: 104,
                        borderRadius: "50%",
                        bgcolor: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography variant="h5" fontWeight={600}>
                        {total}
                    </Typography>

                    <Typography fontSize={11} color="text.secondary">
                        Всего заявок
                    </Typography>
                </Box>
            </Box>

            <Stack spacing={1.5} sx={{ width: "100%" }}>
                {counts.map((item) => (
                    <Stack
                        key={item.status}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: item.color,
                                flexShrink: 0,
                            }}
                        />

                        <Typography fontSize={12} sx={{ flex: 1 }}>
                            {item.label}
                        </Typography>

                        <Typography fontSize={13} fontWeight={500}>
                            {item.count}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Stack>
    );
}

function getStatusMeta(status) {
    return STATUS_META[status] || {
        label: status || "Неизвестен",
        color: "#94a3b8",
    };
}

function AnalyticsPage() {
    const [user, setUser] = useState(null);

    const [analytics, setAnalytics] = useState(null);
    const [zones, setZones] = useState([]);
    const [masters, setMasters] = useState([]);

    const [period, setPeriod] = useState(30);
    const [zoneFilter, setZoneFilter] = useState("ALL");
    const [masterFilter, setMasterFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState("");

    const zoneMap = useMemo(
        () =>
            new Map(
                zones.map((zone) => [
                    String(zone.id),
                    getZoneName(zone),
                ])
            ),
        [zones]
    );

    const masterMap = useMemo(
        () =>
            new Map(
                masters.map((master) => [
                    String(master.id),
                    getMasterName(master),
                ])
            ),
        [masters]
    );

    const loadInitialData = useCallback(async () => {
        try {
            const [profile, zoneList, masterList] = await Promise.all([
                getCurrentProfile(),
                getAllZones(),
                getUsersByRole("ENGINEER"),
            ]);

            setUser(profile);
            setZones(Array.isArray(zoneList) ? zoneList : []);
            setMasters(Array.isArray(masterList) ? masterList : []);
        } catch (err) {
            console.error("Ошибка загрузки справочников аналитики:", err);

            throw new Error(
                err?.response?.data?.message ||
                err.message ||
                "Не удалось загрузить данные страницы."
            );
        }
    }, []);

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const today = new Date();

            const fromDate = new Date(today);
            fromDate.setDate(today.getDate() - period + 1);

            const data = await getAnalytics({
                from: formatDate(fromDate),
                to: formatDate(today),
                zoneId: zoneFilter === "ALL" ? undefined : zoneFilter,
                masterId: masterFilter === "ALL" ? undefined : masterFilter,
            });

            setAnalytics(data);
        } catch (err) {
            console.error("Ошибка загрузки аналитики:", err);
            setError(err.message || "Не удалось загрузить аналитику.");
        } finally {
            setLoading(false);
        }
    }, [period, zoneFilter, masterFilter]);

    useEffect(() => {
        let active = true;

        const initialize = async () => {
            setInitialLoading(true);

            try {
                await loadInitialData();
            } catch (err) {
                if (active) {
                    setError(err.message);
                }
            } finally {
                if (active) {
                    setInitialLoading(false);
                }
            }
        };

        initialize();

        return () => {
            active = false;
        };
    }, [loadInitialData]);

    useEffect(() => {
        if (!initialLoading && user) {
            loadAnalytics();
        }
    }, [initialLoading, user, loadAnalytics]);

    const summary = analytics?.summary || {};

    const total = Number(summary.total || 0);
    const completed = Number(summary.completed || 0);
    const inProgress = Number(summary.inProgress || 0);
    const waiting = Number(summary.waitingForAssignment || 0);
    const cancelled = Number(summary.cancelled || 0);

    const masterStats = useMemo(() => {
        return (analytics?.masters || []).map((master) => ({
            ...master,
            name:
                masterMap.get(String(master.masterId)) ||
                `Мастер ${String(master.masterId || "").slice(0, 8)}`,
        }));
    }, [analytics, masterMap]);

    const zoneStats = useMemo(() => {
        return (analytics?.zones || []).map((zone) => ({
            ...zone,
            name:
                zoneMap.get(String(zone.zoneId)) ||
                `Зона ${String(zone.zoneId || "").slice(0, 8)}`,
        }));
    }, [analytics, zoneMap]);

    const recentRequests = analytics?.recentRequests || [];

    const resetFilters = () => {
        setPeriod(30);
        setZoneFilter("ALL");
        setMasterFilter("ALL");
    };

    const refresh = () => {
        loadAnalytics();
    };

    if (initialLoading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#f5f7fb",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    {error || "Не удалось загрузить профиль пользователя."}
                </Alert>
            </Box>
        );
    }

    if (!["ADMIN", "DISPATCHER"].includes(user.role)) {
        return (
            <MainLayout user={user}>
                <Alert severity="error">
                    У вас недостаточно прав для просмотра аналитики.
                </Alert>
            </MainLayout>
        );
    }

    return (
        <MainLayout user={user}>
            <Box sx={{ maxWidth: 1600, mx: "auto", width: "100%" }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                    spacing={2}
                    sx={{ mb: 2.5 }}
                >
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <ShowChartIcon color="primary" />

                            <Typography variant="h4" fontWeight={600}>
                                Аналитика
                            </Typography>
                        </Stack>

                        <Typography fontSize={14} sx={{ mt: 0.5 }}>
                            Заявки, эффективность мастеров и зоны обслуживания
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={refresh}
                            disabled={loading}
                        >
                            Обновить
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={resetFilters}
                            disabled={loading}
                        >
                            Сбросить фильтры
                        </Button>
                    </Stack>
                </Stack>

                <Alert
                    severity="info"
                    icon={<InfoOutlinedIcon />}
                    sx={{ mb: 2.5, borderRadius: 2 }}
                >
                    Данные аналитики загружаются из request-service.
                    Показатели соответствуют сохранённым заявкам системы.
                </Alert>

                {error && (
                    <Alert severity="error" sx={{ mb: 2.5 }}>
                        {error}
                    </Alert>
                )}

                <Card
                    elevation={0}
                    sx={{
                        border: "1px solid #e5eaf2",
                        borderRadius: 3,
                        mb: 2.5,
                    }}
                >
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="period-label">
                                        Период
                                    </InputLabel>

                                    <Select
                                        labelId="period-label"
                                        label="Период"
                                        value={period}
                                        onChange={(event) =>
                                            setPeriod(Number(event.target.value))
                                        }
                                    >
                                        <MenuItem value={7}>
                                            Последние 7 дней
                                        </MenuItem>

                                        <MenuItem value={14}>
                                            Последние 14 дней
                                        </MenuItem>

                                        <MenuItem value={30}>
                                            Последние 30 дней
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="zone-label">
                                        Зона обслуживания
                                    </InputLabel>

                                    <Select
                                        labelId="zone-label"
                                        label="Зона обслуживания"
                                        value={zoneFilter}
                                        onChange={(event) =>
                                            setZoneFilter(event.target.value)
                                        }
                                    >
                                        <MenuItem value="ALL">
                                            Все зоны
                                        </MenuItem>

                                        {zones.map((zone) => (
                                            <MenuItem
                                                key={zone.id}
                                                value={zone.id}
                                            >
                                                {getZoneName(zone)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="master-label">
                                        Мастер
                                    </InputLabel>

                                    <Select
                                        labelId="master-label"
                                        label="Мастер"
                                        value={masterFilter}
                                        onChange={(event) =>
                                            setMasterFilter(event.target.value)
                                        }
                                    >
                                        <MenuItem value="ALL">
                                            Все мастера
                                        </MenuItem>

                                        {masters.map((master) => (
                                            <MenuItem
                                                key={master.id}
                                                value={master.id}
                                            >
                                                {getMasterName(master)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                                <Typography fontSize={13} color="text.secondary">
                                    Заявок в выборке
                                </Typography>

                                <Typography fontWeight={600} fontSize={22}>
                                    {total}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {loading ? (
                    <Box
                        sx={{
                            py: 8,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                                <MetricCard
                                    title="Всего заявок"
                                    value={total}
                                    description="За выбранный период и фильтры"
                                    icon={<AssignmentOutlinedIcon />}
                                    color="#2563eb"
                                    background="#eff6ff"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                                <MetricCard
                                    title="Завершено"
                                    value={completed}
                                    description={`${summary.completionRate || 0}% от заявок в выборке`}
                                    icon={<CheckCircleIcon />}
                                    color="#059669"
                                    background="#e9f8f1"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                                <MetricCard
                                    title="В работе"
                                    value={inProgress}
                                    description="Назначенные и выполняемые заявки"
                                    icon={<GroupsIcon />}
                                    color="#2563eb"
                                    background="#eff6ff"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                                <MetricCard
                                    title="Ожидают назначения"
                                    value={waiting}
                                    description="Требуют внимания диспетчера"
                                    icon={<WarningAmberIcon />}
                                    color="#d97706"
                                    background="#fff7ed"
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            <Grid size={{ xs: 12, lg: 8 }}>
                                <ChartCard
                                    title="Динамика заявок"
                                    subtitle="Количество поступивших и завершённых заявок по дням"
                                >
                                    <TrendChart trend={analytics?.trend} />
                                </ChartCard>
                            </Grid>

                            <Grid size={{ xs: 12, lg: 4 }}>
                                <ChartCard
                                    title="Структура заявок"
                                    subtitle="Распределение по текущим статусам"
                                >
                                    <StatusChart statuses={analytics?.statuses} />

                                    <Box
                                        sx={{
                                            borderTop: "1px solid #e5eaf2",
                                            mt: 2,
                                            pt: 2,
                                        }}
                                    >
                                        <Typography fontSize={13}>
                                            Отменено заявок:{" "}
                                            <Box
                                                component="span"
                                                fontWeight={600}
                                            >
                                                {cancelled}
                                            </Box>
                                        </Typography>

                                        <Typography fontSize={12} color="text.secondary" sx={{ mt: 1 }}>
                                            Отправлено отчётов:{" "}
                                            {summary.reportSubmitted || 0}
                                        </Typography>

                                        <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5 }}>
                                            Требуют доработки:{" "}
                                            {summary.revisionRequired || 0}
                                        </Typography>
                                    </Box>
                                </ChartCard>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            <Grid size={{ xs: 12, lg: 7 }}>
                                <ChartCard
                                    title="Эффективность мастеров"
                                    subtitle="Сравнение выполненных, находящихся в работе и отменённых заявок"
                                >
                                    {masterStats.length === 0 ? (
                                        <Typography
                                            color="text.secondary"
                                            sx={{ py: 3 }}
                                        >
                                            Нет данных по мастерам за выбранный период
                                        </Typography>
                                    ) : (
                                        <Box sx={{ overflowX: "auto" }}>
                                            <Box sx={{ minWidth: 520 }}>
                                                <Grid
                                                    container
                                                    sx={{
                                                        py: 1.5,
                                                        borderBottom: "1px solid #e5eaf2",
                                                        color: "text.secondary",
                                                    }}
                                                >
                                                    <Grid size={4}>
                                                        <Typography fontSize={12}>
                                                            Мастер
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={2}>
                                                        <Typography fontSize={12}>
                                                            Всего
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={2}>
                                                        <Typography fontSize={12}>
                                                            Завершено
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={2}>
                                                        <Typography fontSize={12}>
                                                            В работе
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={2}>
                                                        <Typography fontSize={12}>
                                                            Отменено
                                                        </Typography>
                                                    </Grid>
                                                </Grid>

                                                {masterStats.map((master) => (
                                                    <Grid
                                                        container
                                                        key={master.masterId}
                                                        alignItems="center"
                                                        sx={{
                                                            py: 1.7,
                                                            borderBottom: "1px solid #f0f3f8",
                                                        }}
                                                    >
                                                        <Grid size={4}>
                                                            <Typography
                                                                fontSize={13}
                                                                fontWeight={600}
                                                            >
                                                                {master.name}
                                                            </Typography>

                                                            <Typography
                                                                fontSize={11}
                                                                color="text.secondary"
                                                            >
                                                                Выполнение: {master.completionRate}%
                                                            </Typography>
                                                        </Grid>

                                                        <Grid size={2}>
                                                            <Typography fontSize={13}>
                                                                {master.total}
                                                            </Typography>
                                                        </Grid>

                                                        <Grid size={2}>
                                                            <Typography fontSize={13}>
                                                                {master.completed}
                                                            </Typography>
                                                        </Grid>

                                                        <Grid size={2}>
                                                            <Typography fontSize={13}>
                                                                {master.inProgress}
                                                            </Typography>
                                                        </Grid>

                                                        <Grid size={2}>
                                                            <Typography fontSize={13}>
                                                                {master.cancelled}
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </ChartCard>
                            </Grid>

                            <Grid size={{ xs: 12, lg: 5 }}>
                                <ChartCard
                                    title="Аналитика по зонам"
                                    subtitle="Нагрузка и выполнение заявок по зонам обслуживания"
                                >
                                    {zoneStats.length === 0 ? (
                                        <Typography
                                            color="text.secondary"
                                            sx={{ py: 3 }}
                                        >
                                            Нет данных по зонам за выбранный период
                                        </Typography>
                                    ) : (
                                        <Stack spacing={2.5}>
                                            {zoneStats.map((zone) => (
                                                <Box key={zone.zoneId}>
                                                    <Stack
                                                        direction="row"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                        sx={{ mb: 1 }}
                                                    >
                                                        <Typography
                                                            fontSize={14}
                                                            fontWeight={600}
                                                        >
                                                            {zone.name}
                                                        </Typography>

                                                        <Typography
                                                            fontSize={13}
                                                            color="text.secondary"
                                                        >
                                                            {zone.completed} из {zone.total}
                                                        </Typography>
                                                    </Stack>

                                                    <Box
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 5,
                                                            bgcolor: "#e5eaf2",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: `${zone.total ? (zone.completed / zone.total) * 100 : 0}%`,
                                                                height: "100%",
                                                                bgcolor: "#10b981",
                                                                borderRadius: 5,
                                                            }}
                                                        />
                                                    </Box>

                                                    <Stack
                                                        direction="row"
                                                        flexWrap="wrap"
                                                        gap={1.5}
                                                        sx={{ mt: 1 }}
                                                    >
                                                        <Typography fontSize={11} color="text.secondary">
                                                            В работе: {zone.inProgress}
                                                        </Typography>

                                                        <Typography fontSize={11} color="text.secondary">
                                                            Ожидают: {zone.waitingForAssignment}
                                                        </Typography>

                                                        <Typography fontSize={11} color="text.secondary">
                                                            Выполнение: {zone.completionRate}%
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </ChartCard>
                            </Grid>
                        </Grid>

                        <ChartCard
                            title="Последние заявки"
                            subtitle="Последние 10 заявок из базы данных"
                        >
                            <Box sx={{ overflowX: "auto" }}>
                                <Box sx={{ minWidth: 540 }}>
                                    <Grid
                                        container
                                        sx={{
                                            py: 1.5,
                                            borderBottom: "1px solid #e5eaf2",
                                            color: "text.secondary",
                                        }}
                                    >
                                        <Grid size={2}>
                                            <Typography fontSize={12}>
                                                Номер
                                            </Typography>
                                        </Grid>

                                        <Grid size={3}>
                                            <Typography fontSize={12}>
                                                Зона
                                            </Typography>
                                        </Grid>

                                        <Grid size={3}>
                                            <Typography fontSize={12}>
                                                Мастер
                                            </Typography>
                                        </Grid>

                                        <Grid size={4}>
                                            <Typography fontSize={12}>
                                                Статус
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    {recentRequests.length === 0 ? (
                                        <Typography
                                            color="text.secondary"
                                            sx={{ py: 3 }}
                                        >
                                            Заявки не найдены
                                        </Typography>
                                    ) : (
                                        recentRequests.map((request) => {
                                            const status = getStatusMeta(request.status);

                                            return (
                                                <Grid
                                                    container
                                                    key={request.id}
                                                    alignItems="center"
                                                    sx={{
                                                        py: 1.5,
                                                        borderBottom: "1px solid #f0f3f8",
                                                    }}
                                                >
                                                    <Grid size={2}>
                                                        <Typography
                                                            fontSize={13}
                                                            fontWeight={600}
                                                        >
                                                            #{String(request.id).slice(0, 8)}
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={3}>
                                                        <Typography fontSize={13}>
                                                            {zoneMap.get(String(request.zoneId)) || "—"}
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={3}>
                                                        <Typography fontSize={13}>
                                                            {masterMap.get(String(request.masterId)) || "Не назначен"}
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={4}>
                                                        <Stack
                                                            direction="row"
                                                            alignItems="center"
                                                            spacing={1}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    width: 8,
                                                                    height: 8,
                                                                    borderRadius: "50%",
                                                                    bgcolor: status.color,
                                                                }}
                                                            />

                                                            <Typography fontSize={12}>
                                                                {status.label}
                                                            </Typography>
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                            );
                                        })
                                    )}
                                </Box>
                            </Box>
                        </ChartCard>
                    </>
                )}
            </Box>
        </MainLayout>
    );
}

export default AnalyticsPage;
