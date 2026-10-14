import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";
import {
  getAllZones,
  getMasterZones,
  assignMasterZones,
} from "../api/zoneApi";

const mastersApi = axios.create({
  baseURL: "http://localhost:8082",
  withCredentials: true,
});

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    "Не удалось выполнить операцию"
  );
}

function getMasterName(master) {
  const fullName = [
    master?.lastName,
    master?.firstName,
    master?.middleName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    fullName ||
    master?.fullName ||
    master?.name ||
    master?.employeeNumber ||
    "Мастер без имени"
  );
}

function getInitials(master) {
  const first = master?.firstName?.[0] || "";
  const last = master?.lastName?.[0] || "";

  if (first || last) {
    return `${last}${first}`.toUpperCase();
  }

  return "М";
}

function normalizeMasters(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.masters)) return data.masters;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function normalizeIds(data) {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.id ?? item?.zoneId;
    })
    .filter(Boolean);
}

export default function AssignMasterZonesPage() {
  const [user, setUser] = useState(null);
  const [masters, setMasters] = useState([]);
  const [zones, setZones] = useState([]);

  const [selectedMaster, setSelectedMaster] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [masterSearch, setMasterSearch] = useState("");
  const [zoneSearch, setZoneSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [saving, setSaving] = useState(false);

  const [mastersError, setMastersError] = useState("");
  const [zonesError, setZonesError] = useState("");

  const [notice, setNotice] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const isAllowed = user?.role === "ADMIN";

  const showNotice = useCallback((message, severity = "success") => {
    setNotice({
      open: true,
      message,
      severity,
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMastersError("");
    setZonesError("");

    try {
      const profile = await getCurrentProfile();
      setUser(profile);

      if (profile?.role !== "ADMIN") {
        setMasters([]);
        setZones([]);
        return;
      }

      const [mastersResult, zonesResult] = await Promise.allSettled([
        mastersApi.get("/api/masters"),
        getAllZones(),
      ]);

      if (mastersResult.status === "fulfilled") {
        const loadedMasters = normalizeMasters(mastersResult.value.data);
        setMasters(loadedMasters);

        if (
          selectedMaster &&
          !loadedMasters.some((master) => master.id === selectedMaster.id)
        ) {
          setSelectedMaster(null);
          setSelectedIds([]);
        }
      } else {
        setMasters([]);
        setMastersError(
          `Не удалось загрузить мастеров: ${getErrorMessage(
            mastersResult.reason
          )}`
        );
      }

      if (zonesResult.status === "fulfilled") {
        setZones(Array.isArray(zonesResult.value) ? zonesResult.value : []);
      } else {
        setZones([]);
        setZonesError(
          `Не удалось загрузить зоны: ${getErrorMessage(zonesResult.reason)}`
        );
      }
    } catch (error) {
      showNotice(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [selectedMaster, showNotice]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedMaster?.id) {
      setSelectedIds([]);
      return undefined;
    }

    let cancelled = false;

    const loadAssignments = async () => {
      setLoadingAssignments(true);

      try {
        const data = await getMasterZones(selectedMaster.id);

        if (cancelled) return;

        setSelectedIds(normalizeIds(data));
      } catch (error) {
        if (!cancelled) {
          setSelectedIds([]);
          showNotice(
            `Не удалось загрузить назначения зон: ${getErrorMessage(error)}`,
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAssignments(false);
        }
      }
    };

    loadAssignments();

    return () => {
      cancelled = true;
    };
  }, [selectedMaster, showNotice]);

  const filteredMasters = useMemo(() => {
    const query = masterSearch.trim().toLowerCase();

    if (!query) return masters;

    return masters.filter((master) => {
      const searchable = [
        getMasterName(master),
        master?.employeeNumber,
        master?.email,
        master?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [masters, masterSearch]);

  const filteredZones = useMemo(() => {
    const query = zoneSearch.trim().toLowerCase();

    if (!query) return zones;

    return zones.filter((zone) =>
      `${zone?.name || ""} ${zone?.description || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [zones, zoneSearch]);

  const selectedZones = useMemo(
    () => zones.filter((zone) => selectedIds.includes(zone.id)),
    [zones, selectedIds]
  );

  const toggleZone = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((zoneId) => zoneId !== id)
        : [...current, id]
    );
  };

  const handleSelectMaster = (master) => {
    if (selectedMaster?.id === master.id) return;

    setSelectedMaster(master);
    setSelectedIds([]);
    setZoneSearch("");
  };

  const handleSave = async () => {
    if (!selectedMaster?.id) {
      showNotice("Сначала выберите мастера", "warning");
      return;
    }

    setSaving(true);

    try {
      await assignMasterZones(selectedMaster.id, selectedIds);

      showNotice(
        `Назначения зон для мастера «${getMasterName(
          selectedMaster
        )}» сохранены`
      );
    } catch (error) {
      showNotice(
        `Не удалось сохранить назначения: ${getErrorMessage(error)}`,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout user={user}>
        <Box
          sx={{
            minHeight: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!user || !isAllowed) {
    return (
      <MainLayout user={user}>
        <Alert severity="error">
          У вас нет доступа к назначению зон мастерам. Эта страница доступна
          только администратору.
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user}>
      <Box sx={{ maxWidth: 1600, mx: "auto", pb: 4 }}>
        {/* Заголовок */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2.5,
                bgcolor: "#DBEAFE",
                color: "#1D4ED8",
              }}
            >
              <AssignmentIndOutlinedIcon fontSize="large" />
            </Box>

            <Box>
              <Typography variant="h4" fontWeight={750}>
                Назначение зон
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Управление территориями обслуживания мастеров
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            onClick={loadData}
            disabled={loading || saving}
            startIcon={<RefreshOutlinedIcon />}
            sx={{
              height: 36,
              minWidth: 0,
              px: 1.5,
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            Обновить данные
          </Button>
        </Stack>

        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Выберите мастера, отметьте все зоны, которые он обслуживает, и
          сохраните изменения. Одному мастеру можно назначить несколько зон.
          Назначения не изменяют данные его профиля.
        </Alert>

        {mastersError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {mastersError}
          </Alert>
        )}

        {zonesError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {zonesError}
          </Alert>
        )}

        {/* Статистика */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
            mb: 3,
          }}
        >
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: "#DBEAFE",
                  color: "#1D4ED8",
                  width: 46,
                  height: 46,
                }}
              >
                <GroupsOutlinedIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Всего мастеров
                </Typography>
                <Typography variant="h5" fontWeight={750}>
                  {masters.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: "#D1FAE5",
                  color: "#047857",
                  width: 46,
                  height: 46,
                }}
              >
                <MapOutlinedIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Зон в справочнике
                </Typography>
                <Typography variant="h5" fontWeight={750}>
                  {zones.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: "#EDE9FE",
                  color: "#6D28D9",
                  width: 46,
                  height: 46,
                }}
              >
                <CheckCircleOutlinedIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Выбрано зон
                </Typography>
                <Typography variant="h5" fontWeight={750}>
                  {selectedIds.length}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Основная область */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              lg: "minmax(280px, 0.85fr) minmax(0, 1.65fr)",
            },
            gap: 3,
            alignItems: "start",
          }}
        >
          {/* Список мастеров */}
          <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, bgcolor: "#F8FAFC" }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonSearchOutlinedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Выберите мастера
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Найдите сотрудника в списке
              </Typography>
            </Box>

            <Divider />

            <CardContent sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                value={masterSearch}
                onChange={(event) => setMasterSearch(event.target.value)}
                placeholder="ФИО или табельный номер"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Stack spacing={1}>
                {filteredMasters.map((master) => {
                  const selected = selectedMaster?.id === master.id;

                  return (
                    <Card
                      key={master.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderColor: selected ? "#2563EB" : "divider",
                        bgcolor: selected ? "#EFF6FF" : "background.paper",
                        boxShadow: selected ? "0 0 0 1px #2563EB" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <CardActionArea
                        onClick={() => handleSelectMaster(master)}
                        sx={{ p: 1.5 }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                        >
                          <Avatar
                            sx={{
                              bgcolor: selected ? "#2563EB" : "#E2E8F0",
                              color: selected ? "#FFFFFF" : "#334155",
                              width: 44,
                              height: 44,
                              fontWeight: 700,
                            }}
                          >
                            {getInitials(master)}
                          </Avatar>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              fontWeight={650}
                              sx={{ overflowWrap: "anywhere" }}
                            >
                              {getMasterName(master)}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.3 }}
                            >
                              {master.employeeNumber
                                ? `Табельный № ${master.employeeNumber}`
                                : "Мастер"}
                            </Typography>
                          </Box>

                          {selected && (
                            <CheckCircleOutlinedIcon color="primary" />
                          )}
                        </Stack>
                      </CardActionArea>
                    </Card>
                  );
                })}

                {filteredMasters.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 5, px: 2 }}>
                    <PersonSearchOutlinedIcon
                      sx={{ fontSize: 42, color: "text.disabled", mb: 1 }}
                    />
                    <Typography fontWeight={600}>Мастеры не найдены</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Измените поисковый запрос или проверьте список мастеров.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Назначение зон */}
          <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, bgcolor: "#F8FAFC" }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                spacing={1.5}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Зоны обслуживания
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Отметьте территории работы мастера
                  </Typography>
                </Box>

                <Chip
                  label={`Выбрано: ${selectedIds.length}`}
                  color={selectedIds.length ? "primary" : "default"}
                  variant={selectedIds.length ? "filled" : "outlined"}
                />
              </Stack>
            </Box>

            <Divider />

            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              {!selectedMaster ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: { xs: 5, md: 9 },
                    px: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 72,
                      height: 72,
                      mx: "auto",
                      mb: 2,
                      bgcolor: "#DBEAFE",
                      color: "#1D4ED8",
                    }}
                  >
                    <AssignmentIndOutlinedIcon sx={{ fontSize: 36 }} />
                  </Avatar>

                  <Typography variant="h6" fontWeight={700}>
                    Сначала выберите мастера
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{ maxWidth: 360, mx: "auto", mt: 1 }}
                  >
                    После выбора сотрудника здесь появятся его текущие зоны и
                    доступные территории обслуживания.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2.5}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#F8FAFC",
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ bgcolor: "#1D4ED8" }}>
                        {getInitials(selectedMaster)}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700}>
                          {getMasterName(selectedMaster)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Назначение зон выбранному сотруднику
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label={`${selectedIds.length} выбрано`}
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                  </Paper>

                  {loadingAssignments && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={18} />
                      <Typography variant="body2" color="text.secondary">
                        Загружаем текущие назначения...
                      </Typography>
                    </Box>
                  )}

                  <TextField
                    fullWidth
                    size="small"
                    value={zoneSearch}
                    onChange={(event) => setZoneSearch(event.target.value)}
                    placeholder="Поиск зоны"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlinedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {zones.length === 0 ? (
                    <Alert severity="warning">
                      Список зон пуст. Сначала создайте зоны на странице «Зоны».
                    </Alert>
                  ) : filteredZones.length === 0 ? (
                    <Alert severity="info">
                      По вашему запросу ничего не найдено.
                    </Alert>
                  ) : (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "minmax(0, 1fr)",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 1.5,
                      }}
                    >
                      {filteredZones.map((zone) => {
                        const checked = selectedIds.includes(zone.id);

                        return (
                          <Card
                            key={zone.id}
                            variant="outlined"
                            sx={{
                              borderRadius: 2.5,
                              borderColor: checked ? "#2563EB" : "divider",
                              bgcolor: checked ? "#EFF6FF" : "background.paper",
                              boxShadow: checked
                                ? "0 0 0 1px #2563EB"
                                : "none",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <CardActionArea
                              onClick={() => toggleZone(zone.id)}
                              disabled={loadingAssignments || saving}
                              sx={{ height: "100%", p: 1.75 }}
                            >
                              <Stack
                                direction="row"
                                alignItems="flex-start"
                                spacing={1}
                              >
                                <Avatar
                                  variant="rounded"
                                  sx={{
                                    width: 42,
                                    height: 42,
                                    bgcolor: checked ? "#DBEAFE" : "#F1F5F9",
                                    color: checked ? "#1D4ED8" : "#64748B",
                                  }}
                                >
                                  <MapOutlinedIcon />
                                </Avatar>

                                <Box sx={{ flex: 1, minWidth: 0, pt: 0.3 }}>
                                  <Typography fontWeight={650}>
                                    {zone.name}
                                  </Typography>

                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5, overflowWrap: "anywhere" }}
                                  >
                                    {zone.description ||
                                      (checked
                                        ? "Зона назначена"
                                        : "Нажмите, чтобы назначить")}
                                  </Typography>
                                </Box>

                                <Checkbox
                                  checked={checked}
                                  tabIndex={-1}
                                  disableRipple
                                  sx={{ p: 0.25 }}
                                />
                              </Stack>
                            </CardActionArea>
                          </Card>
                        );
                      })}
                    </Box>
                  )}

                  <Divider />

                  <Box>
                    <Typography fontWeight={700} sx={{ mb: 1.25 }}>
                      Итог назначения
                    </Typography>

                    {selectedZones.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Пока не выбрана ни одна зона.
                      </Typography>
                    ) : (
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {selectedZones.map((zone) => (
                          <Chip
                            key={zone.id}
                            label={zone.name}
                            color="primary"
                            variant="outlined"
                            onDelete={() => toggleZone(zone.id)}
                            disabled={saving || loadingAssignments}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: { xs: "stretch", sm: "center" },
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2,
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#F8FAFC",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Изменения вступят в силу после сохранения.
                    </Typography>

                    <Button
                      variant="contained"
                      size="large"
                      startIcon={
                        saving ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <SaveOutlinedIcon />
                        )
                      }
                      onClick={handleSave}
                      disabled={saving || loadingAssignments}
                      sx={{
                        minWidth: 220,
                        borderRadius: 2,
                        py: 1.25,
                        fontWeight: 700,
                        boxShadow: "none",
                      }}
                    >
                      {saving ? "Сохранение..." : "Сохранить назначения"}
                    </Button>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Snackbar
        open={notice.open}
        autoHideDuration={5000}
        onClose={() =>
          setNotice((current) => ({ ...current, open: false }))
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={notice.severity}
          variant="filled"
          onClose={() =>
            setNotice((current) => ({ ...current, open: false }))
          }
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
}