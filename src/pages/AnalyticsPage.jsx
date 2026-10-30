
import { useEffect, useMemo, useState } from "react";
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

const MOCK_REQUESTS = [
  { id: 1001, day: 2, zone: "Северная", master: "Иванов И.И.", status: "COMPLETED", hours: 2.1 },
  { id: 1002, day: 3, zone: "Центральная", master: "Петров П.П.", status: "COMPLETED", hours: 3.4 },
  { id: 1003, day: 4, zone: "Южная", master: "Сидоров А.А.", status: "IN_WORK", hours: 0 },
  { id: 1004, day: 5, zone: "Северная", master: "Иванов И.И.", status: "COMPLETED", hours: 1.5 },
  { id: 1005, day: 6, zone: "Центральная", master: "Петров П.П.", status: "CANCELLED", hours: 0 },
  { id: 1006, day: 7, zone: "Южная", master: "Сидоров А.А.", status: "WAITING_FOR_ASSIGNMENT", hours: 0 },
  { id: 1007, day: 8, zone: "Северная", master: "Иванов И.И.", status: "COMPLETED", hours: 2.8 },
  { id: 1008, day: 9, zone: "Центральная", master: "Петров П.П.", status: "IN_WORK", hours: 0 },
  { id: 1009, day: 10, zone: "Южная", master: "Сидоров А.А.", status: "COMPLETED", hours: 4.2 },
  { id: 1010, day: 11, zone: "Северная", master: "Иванов И.И.", status: "COMPLETED", hours: 1.9 },
  { id: 1011, day: 12, zone: "Центральная", master: "Петров П.П.", status: "WAITING_FOR_ASSIGNMENT", hours: 0 },
  { id: 1012, day: 13, zone: "Южная", master: "Сидоров А.А.", status: "COMPLETED", hours: 2.7 },
  { id: 1013, day: 14, zone: "Северная", master: "Иванов И.И.", status: "COMPLETED", hours: 1.8 },
  { id: 1014, day: 15, zone: "Центральная", master: "Петров П.П.", status: "IN_WORK", hours: 0 },
  { id: 1015, day: 16, zone: "Южная", master: "Сидоров А.А.", status: "CANCELLED", hours: 0 },
  { id: 1016, day: 17, zone: "Северная", master: "Иванов И.И.", status: "COMPLETED", hours: 2.3 },
  { id: 1017, day: 18, zone: "Центральная", master: "Петров П.П.", status: "COMPLETED", hours: 3.1 },
  { id: 1018, day: 19, zone: "Южная", master: "Сидоров А.А.", status: "IN_WORK", hours: 0 },
  { id: 1019, day: 20, zone: "Северная", master: "Иванов И.И.", status: "COMPLETED", hours: 1.6 },
  { id: 1020, day: 21, zone: "Центральная", master: "Петров П.П.", status: "COMPLETED", hours: 2.4 },
  { id: 1021, day: 22, zone: "Южная", master: "Сидоров А.А.", status: "WAITING_FOR_ASSIGNMENT", hours: 0 },
  { id: 1022, day: 23, zone: "Северная", master: "Иванов И.И.", status: "COMPLETED", hours: 2.0 },
  { id: 1023, day: 24, zone: "Центральная", master: "Петров П.П.", status: "COMPLETED", hours: 3.6 },
  { id: 1024, day: 25, zone: "Южная", master: "Сидоров А.А.", status: "IN_WORK", hours: 0 },
  { id: 1025, day: 26, zone: "Северная", master: "Иванов И.И.", status: "COMPLETED", hours: 1.7 },
  { id: 1026, day: 27, zone: "Центральная", master: "Петров П.П.", status: "COMPLETED", hours: 2.9 },
  { id: 1027, day: 28, zone: "Южная", master: "Сидоров А.А.", status: "CANCELLED", hours: 0 },
  { id: 1028, day: 29, zone: "Северная", master: "Иванов И.И.", status: "COMPLETED", hours: 2.2 },
  { id: 1029, day: 30, zone: "Центральная", master: "Петров П.П.", status: "COMPLETED", hours: 3.0 },
];

const ZONES = ["Северная", "Центральная", "Южная"];

const STATUS_META = {
  COMPLETED: { label: "Завершены", color: "#10b981" },
  IN_WORK: { label: "В работе", color: "#2563eb" },
  WAITING_FOR_ASSIGNMENT: {
    label: "Ожидают назначения",
    color: "#f59e0b",
  },
  CANCELLED: { label: "Отменены", color: "#ef4444" },
};

const MASTER_META = [
  { name: "Иванов И.И.", zone: "Северная" },
  { name: "Петров П.П.", zone: "Центральная" },
  { name: "Сидоров А.А.", zone: "Южная" },
];

function MetricCard({ title, value, description, icon, color, background }) {
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
        <Stack direction="row" justifyContent="space-between" alignItems="center">
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

        <Typography fontSize={12} color="text.secondary" sx={{ mt: 1 }}>
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
        <Typography fontWeight={600}>{title}</Typography>
        <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          {subtitle}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function TrendChart({ requests, days }) {
  const points = useMemo(() => {
    const interval = Math.max(1, Math.ceil(days / 10));
    const labels = [];

    for (let day = 3; day <= days; day += interval) {
      labels.push(day);
    }

    if (labels[labels.length - 1] !== days) labels.push(days);

    return labels.map((day) => {
      const received = requests.filter((request) => request.day === day).length;
      const completed = requests.filter(
        (request) => request.day === day && request.status === "COMPLETED",
      ).length;

      return {
        day,
        received: received || Math.max(2, Math.round(6 - day / 10)),
        completed: completed || Math.max(1, Math.round(4 - day / 12)),
      };
    });
  }, [requests, days]);

  const width = 700;
  const height = 250;
  const left = 42;
  const right = 10;
  const top = 18;
  const bottom = 32;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(
    6,
    ...points.map((point) => Math.max(point.received, point.completed)),
  );

  const getX = (index) =>
    left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * chartWidth);

  const getY = (value) => top + chartHeight - (value / maxValue) * chartHeight;

  const makePath = (key) =>
    points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(point[key])}`,
      )
      .join(" ");

  return (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.7}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#2563eb" }} />
          <Typography fontSize={12}>Поступило</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.7}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
          <Typography fontSize={12}>Завершено</Typography>
        </Stack>
      </Stack>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="График поступивших и завершённых заявок"
        style={{ width: "100%", display: "block" }}
      >
        {[0, 2, 4, 6].map((value) => (
          <g key={value}>
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

        <path d={makePath("received")} fill="none" stroke="#2563eb" strokeWidth="3" />
        <path d={makePath("completed")} fill="none" stroke="#10b981" strokeWidth="3" />

        {points.map((point, index) => (
          <g key={point.day}>
            <circle cx={getX(index)} cy={getY(point.received)} r="3.5" fill="#2563eb" />
            <circle cx={getX(index)} cy={getY(point.completed)} r="3.5" fill="#10b981" />
            <text
              x={getX(index)}
              y={height - 8}
              fontSize="10"
              textAnchor="middle"
              fill="#64748b"
            >
              {point.day}
            </text>
          </g>
        ))}
      </svg>
    </Box>
  );
}

function StatusChart({ requests }) {
  const counts = Object.entries(STATUS_META).map(([status, meta]) => ({
    status,
    ...meta,
    count: requests.filter((request) => request.status === status).length,
  }));

  const total = requests.length;
  let accumulated = 0;

  const gradient = counts
    .map((item) => {
      const start = accumulated;
      accumulated += total ? (item.count / total) * 100 : 0;
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
          background: `conic-gradient(${gradient})`,
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
          <Typography variant="h5" fontWeight={600}>{total}</Typography>
          <Typography fontSize={11} color="text.secondary">Всего заявок</Typography>
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

function AnalyticsPage() {
  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [period, setPeriod] = useState(30);
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [masterFilter, setMasterFilter] = useState("ALL");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const profile = await getCurrentProfile();

        if (active) {
          setUser(profile);
          setProfileError("");
        }
      } catch (error) {
        console.error("Не удалось загрузить профиль:", error);

        if (active) {
          setProfileError(
            error?.response?.data?.message ||
              "Не удалось загрузить профиль. Проверь авторизацию и доступность user-service.",
          );
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    return MOCK_REQUESTS.filter((request) => {
      const matchesPeriod = request.day <= period;
      const matchesZone = zoneFilter === "ALL" || request.zone === zoneFilter;
      const matchesMaster =
        masterFilter === "ALL" || request.master === masterFilter;

      return matchesPeriod && matchesZone && matchesMaster;
    });
  }, [period, zoneFilter, masterFilter]);

  const total = filteredRequests.length;
  const completed = filteredRequests.filter(
    (request) => request.status === "COMPLETED",
  ).length;
  const inWork = filteredRequests.filter(
    (request) => request.status === "IN_WORK",
  ).length;
  const waiting = filteredRequests.filter(
    (request) => request.status === "WAITING_FOR_ASSIGNMENT",
  ).length;
  const cancelled = filteredRequests.filter(
    (request) => request.status === "CANCELLED",
  ).length;

  const completedRequests = filteredRequests.filter(
    (request) => request.status === "COMPLETED" && request.hours > 0,
  );
  const averageHours = completedRequests.length
    ? (
        completedRequests.reduce((sum, request) => sum + request.hours, 0) /
        completedRequests.length
      ).toFixed(1)
    : "—";

  const masterStats = MASTER_META.map((master) => {
    const masterRequests = filteredRequests.filter(
      (request) => request.master === master.name,
    );
    const masterCompleted = masterRequests.filter(
      (request) => request.status === "COMPLETED",
    ).length;
    const masterInWork = masterRequests.filter(
      (request) => request.status === "IN_WORK",
    ).length;
    const masterCancelled = masterRequests.filter(
      (request) => request.status === "CANCELLED",
    ).length;
    const durations = masterRequests.filter(
      (request) => request.status === "COMPLETED" && request.hours > 0,
    );
    const avg = durations.length
      ? (
          durations.reduce((sum, request) => sum + request.hours, 0) /
          durations.length
        ).toFixed(1)
      : "—";

    return {
      ...master,
      total: masterRequests.length,
      completed: masterCompleted,
      inWork: masterInWork,
      cancelled: masterCancelled,
      avg,
      share: masterRequests.length
        ? Math.round((masterCompleted / masterRequests.length) * 100)
        : 0,
    };
  });

  const zoneStats = ZONES.map((zone) => {
    const zoneRequests = filteredRequests.filter(
      (request) => request.zone === zone,
    );
    const zoneCompleted = zoneRequests.filter(
      (request) => request.status === "COMPLETED",
    );
    const durations = zoneCompleted.filter((request) => request.hours > 0);

    return {
      zone,
      total: zoneRequests.length,
      completed: zoneCompleted.length,
      inWork: zoneRequests.filter((request) => request.status === "IN_WORK").length,
      waiting: zoneRequests.filter(
        (request) => request.status === "WAITING_FOR_ASSIGNMENT",
      ).length,
      avg: durations.length
        ? (
            durations.reduce((sum, request) => sum + request.hours, 0) /
            durations.length
          ).toFixed(1)
        : "—",
    };
  });

  const resetFilters = () => {
    setPeriod(30);
    setZoneFilter("ALL");
    setMasterFilter("ALL");
  };

  if (profileLoading) {
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
          {profileError || "Не удалось загрузить профиль пользователя."}
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

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetFilters}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
          >
            Сбросить фильтры
          </Button>
        </Stack>

        <Alert
          severity="info"
          icon={<InfoOutlinedIcon />}
          sx={{ mb: 2.5, borderRadius: 2 }}
        >
          Демонстрационный режим: показатели рассчитаны по тестовым данным
          внутри frontend и не отражают реальные данные компании.
        </Alert>

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
                  <InputLabel id="period-label">Период</InputLabel>
                  <Select
                    labelId="period-label"
                    label="Период"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value)}
                  >
                    <MenuItem value={7}>Последние 7 дней</MenuItem>
                    <MenuItem value={14}>Последние 14 дней</MenuItem>
                    <MenuItem value={30}>Последние 30 дней</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="zone-label">Зона обслуживания</InputLabel>
                  <Select
                    labelId="zone-label"
                    label="Зона обслуживания"
                    value={zoneFilter}
                    onChange={(event) => setZoneFilter(event.target.value)}
                  >
                    <MenuItem value="ALL">Все зоны</MenuItem>
                    {ZONES.map((zone) => (
                      <MenuItem key={zone} value={zone}>{zone}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="master-label">Мастер</InputLabel>
                  <Select
                    labelId="master-label"
                    label="Мастер"
                    value={masterFilter}
                    onChange={(event) => setMasterFilter(event.target.value)}
                  >
                    <MenuItem value="ALL">Все мастера</MenuItem>
                    {MASTER_META.map((master) => (
                      <MenuItem key={master.name} value={master.name}>
                        {master.name}
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
              description={`${total ? Math.round((completed / total) * 100) : 0}% от заявок в выборке`}
              icon={<CheckCircleIcon />}
              color="#059669"
              background="#e9f8f1"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
            <MetricCard
              title="В работе"
              value={inWork}
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
              subtitle="Количество поступивших и завершённых заявок по временным интервалам"
            >
              <TrendChart requests={filteredRequests} days={period} />
            </ChartCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <ChartCard
              title="Структура заявок"
              subtitle="Распределение по текущим статусам"
            >
              <StatusChart requests={filteredRequests} />
              <Box sx={{ borderTop: "1px solid #e5eaf2", mt: 2, pt: 2 }}>
                <Typography fontSize={13}>
                  Среднее время выполнения:{" "}
                  <Box component="span" fontWeight={600}>
                    {averageHours}{averageHours !== "—" ? " ч" : ""}
                  </Box>
                </Typography>
                <Typography fontSize={12} color="text.secondary" sx={{ mt: 1 }}>
                  Отменено заявок: {cancelled}
                </Typography>
              </Box>
            </ChartCard>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <ChartCard
              title="Эффективность мастеров"
              subtitle="Сравнение выполненных заявок и средней продолжительности работ"
            >
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ minWidth: 560 }}>
                  <Grid
                    container
                    sx={{
                      py: 1.5,
                      borderBottom: "1px solid #e5eaf2",
                      color: "text.secondary",
                    }}
                  >
                    <Grid size={3}><Typography fontSize={12}>Мастер</Typography></Grid>
                    <Grid size={2}><Typography fontSize={12}>Завершено</Typography></Grid>
                    <Grid size={2}><Typography fontSize={12}>В работе</Typography></Grid>
                    <Grid size={2}><Typography fontSize={12}>Отменено</Typography></Grid>
                    <Grid size={3}><Typography fontSize={12}>Среднее время</Typography></Grid>
                  </Grid>

                  {masterStats.map((master) => (
                    <Grid
                      container
                      key={master.name}
                      alignItems="center"
                      sx={{ py: 1.7, borderBottom: "1px solid #f0f3f8" }}
                    >
                      <Grid size={3}>
                        <Typography fontSize={13} fontWeight={600}>
                          {master.name}
                        </Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {master.zone}
                        </Typography>
                      </Grid>
                      <Grid size={2}>
                        <Typography fontSize={13}>{master.completed}</Typography>
                      </Grid>
                      <Grid size={2}>
                        <Typography fontSize={13}>{master.inWork}</Typography>
                      </Grid>
                      <Grid size={2}>
                        <Typography fontSize={13}>{master.cancelled}</Typography>
                      </Grid>
                      <Grid size={3}>
                        <Typography fontSize={13}>
                          {master.avg}{master.avg !== "—" ? " ч" : ""}
                        </Typography>
                        <Box
                          sx={{
                            height: 5,
                            bgcolor: "#e5eaf2",
                            borderRadius: 5,
                            mt: 0.7,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: `${master.share}%`,
                              height: "100%",
                              bgcolor: "#10b981",
                              borderRadius: 5,
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              </Box>
            </ChartCard>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <ChartCard
              title="Аналитика по зонам"
              subtitle="Нагрузка и выполнение заявок по зонам обслуживания"
            >
              <Stack spacing={2.5}>
                {zoneStats.map((zone) => (
                  <Box key={zone.zone}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography fontSize={14} fontWeight={600}>
                        {zone.zone}
                      </Typography>
                      <Typography fontSize={13} color="text.secondary">
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
                        В работе: {zone.inWork}
                      </Typography>
                      <Typography fontSize={11} color="text.secondary">
                        Ожидают: {zone.waiting}
                      </Typography>
                      <Typography fontSize={11} color="text.secondary">
                        Среднее время: {zone.avg}{zone.avg !== "—" ? " ч" : ""}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </ChartCard>
          </Grid>
        </Grid>

        <ChartCard
          title="Последние заявки"
          subtitle="Примеры заявок из демонстрационного набора данных"
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
                <Grid size={2}><Typography fontSize={12}>Номер</Typography></Grid>
                <Grid size={3}><Typography fontSize={12}>Зона</Typography></Grid>
                <Grid size={3}><Typography fontSize={12}>Мастер</Typography></Grid>
                <Grid size={4}><Typography fontSize={12}>Статус</Typography></Grid>
              </Grid>

              {[...filteredRequests].reverse().slice(0, 8).map((request) => {
                const status = STATUS_META[request.status];

                return (
                  <Grid
                    container
                    key={request.id}
                    alignItems="center"
                    sx={{ py: 1.5, borderBottom: "1px solid #f0f3f8" }}
                  >
                    <Grid size={2}>
                      <Typography fontSize={13} fontWeight={600}>
                        #{request.id}
                      </Typography>
                    </Grid>
                    <Grid size={3}>
                      <Typography fontSize={13}>{request.zone}</Typography>
                    </Grid>
                    <Grid size={3}>
                      <Typography fontSize={13}>{request.master}</Typography>
                    </Grid>
                    <Grid size={4}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: status.color,
                          }}
                        />
                        <Typography fontSize={12}>{status.label}</Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                );
              })}
            </Box>
          </Box>
        </ChartCard>
      </Box>
    </MainLayout>
  );
}

export default AnalyticsPage;
