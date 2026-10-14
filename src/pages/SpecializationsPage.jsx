
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Autocomplete,
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
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";
import { getEquipmentTypes } from "../api/equipmentApi";

import {
  getSpecializations,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
  getMasterSpecializations,
  assignMasterSpecializations,
} from "../api/specializationApi";

import axios from "axios";

const USER_API_URL = "http://localhost:8082/api";

const emptyForm = {
  name: "",
  equipmentTypeIds: [],
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    "Не удалось выполнить операцию"
  );
}

function getEquipmentTypeName(type, id) {
  const found = type?.find((item) => item.id === id);
  return found?.name || found?.title || "Тип оборудования";
}

function getSpecializationEquipmentNames(specialization, equipmentTypes) {
  const ids = specialization?.equipmentTypeIds || [];

  if (!ids.length) {
    return ["Тип оборудования не указан"];
  }

  return ids.map((id) => getEquipmentTypeName(equipmentTypes, id));
}

function getUserName(user) {
  return [
    user?.lastName,
    user?.firstName,
    user?.middleName,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function SpecializationsPage() {
  const [user, setUser] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [mySpecializations, setMySpecializations] = useState([]);

  const [masters, setMasters] = useState([]);
  const [selectedMasterId, setSelectedMasterId] = useState("");
  const [assignedSpecializationIds, setAssignedSpecializationIds] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpecialization, setEditingSpecialization] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [notice, setNotice] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const role = user?.role;

  const isAdmin = role === "ADMIN";
  const isDispatcher = role === "DISPATCHER";
  const isEngineer = role === "ENGINEER";

  const equipmentTypeOptions = useMemo(
    () =>
      equipmentTypes.map((type) => ({
        id: type.id,
        name: type.name || type.title || "Без названия",
      })),
    [equipmentTypes]
  );

  const showNotice = (message, severity = "success") => {
    setNotice({
      open: true,
      message,
      severity,
    });
  };

  const loadBaseData = useCallback(async () => {
    setLoading(true);

    try {
      const profile = await getCurrentProfile();
      setUser(profile);

      const types = await getEquipmentTypes();
      setEquipmentTypes(Array.isArray(types) ? types : []);

      if (profile.role === "ADMIN" || profile.role === "DISPATCHER") {
        const items = await getSpecializations();
        setSpecializations(Array.isArray(items) ? items : []);
      }

      if (profile.role === "ENGINEER") {
        setMySpecializations(
          Array.isArray(profile.specializations)
            ? profile.specializations
            : []
        );
      }

      if (profile.role === "DISPATCHER") {
        // Требуемый контракт endpoint:
        // GET http://localhost:8082/api/masters
        // [{ id, firstName, lastName, middleName, employeeNumber }]
        const { data } = await axios.get(
          `${USER_API_URL}/masters`,
          { withCredentials: true }
        );

        setMasters(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      showNotice(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    if (!selectedMasterId || !isDispatcher) {
      setAssignedSpecializationIds([]);
      return;
    }

    let cancelled = false;

    const loadAssignments = async () => {
      try {
        const data = await getMasterSpecializations(selectedMasterId);

        if (!cancelled) {
          setAssignedSpecializationIds(
            Array.isArray(data) ? data.map((item) => item.id) : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setAssignedSpecializationIds([]);
          showNotice(getErrorMessage(error), "error");
        }
      }
    };

    loadAssignments();

    return () => {
      cancelled = true;
    };
  }, [selectedMasterId, isDispatcher]);

  const openCreateDialog = () => {
    setEditingSpecialization(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (specialization) => {
    setEditingSpecialization(specialization);
    setForm({
      name: specialization.name || "",
      equipmentTypeIds: specialization.equipmentTypeIds || [],
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setEditingSpecialization(null);
    setForm(emptyForm);
  };

  const handleSaveSpecialization = async () => {
    const normalizedName = form.name.trim();

    if (!normalizedName) {
      showNotice("Введите название специализации", "warning");
      return;
    }

    if (!form.equipmentTypeIds.length) {
      showNotice(
        "Выберите хотя бы один тип оборудования",
        "warning"
      );
      return;
    }

    const payload = {
      name: normalizedName,
      equipmentTypeIds: form.equipmentTypeIds,
    };

    setSaving(true);

    try {
      if (editingSpecialization) {
        await updateSpecialization(editingSpecialization.id, payload);
        showNotice("Специализация обновлена");
      } else {
        await createSpecialization(payload);
        showNotice("Специализация создана");
      }

      setDialogOpen(false);
      setEditingSpecialization(null);
      setForm(emptyForm);

      const items = await getSpecializations();
      setSpecializations(Array.isArray(items) ? items : []);
    } catch (error) {
      showNotice(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpecialization = async () => {
    if (!deleteTarget) return;

    setSaving(true);

    try {
      await deleteSpecialization(deleteTarget.id);

      setSpecializations((current) =>
        current.filter((item) => item.id !== deleteTarget.id)
      );

      showNotice("Специализация удалена");
      setDeleteTarget(null);
    } catch (error) {
      showNotice(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedMasterId) {
      showNotice("Сначала выберите мастера", "warning");
      return;
    }

    setSaving(true);

    try {
      const updated = await assignMasterSpecializations(
        selectedMasterId,
        assignedSpecializationIds
      );

      setAssignedSpecializationIds(
        Array.isArray(updated) ? updated.map((item) => item.id) : []
      );

      showNotice("Специализации мастера сохранены");
    } catch (error) {
      showNotice(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedMaster = masters.find(
    (master) => master.id === selectedMasterId
  );

  const pageTitle = isAdmin
    ? "Справочник специализаций"
    : isDispatcher
      ? "Специализации мастеров"
      : "Мои специализации";

  if (loading) {
    return (
      <MainLayout user={user}>
        <Box
          sx={{
            minHeight: 300,
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

  if (!user || !["ADMIN", "DISPATCHER", "ENGINEER"].includes(role)) {
    return (
      <MainLayout user={user}>
        <Alert severity="error">
          У вас нет доступа к разделу специализаций.
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={user}>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {pageTitle}
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {isAdmin &&
                "Управление специализациями и типами обслуживаемого оборудования"}
              {isDispatcher &&
                "Назначение специализаций мастерам"}
              {isEngineer &&
                "Список специализаций, назначенных вашему профилю"}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={loadBaseData}
            >
              Обновить
            </Button>

            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddOutlinedIcon />}
                onClick={openCreateDialog}
              >
                Создать специализацию
              </Button>
            )}
          </Stack>
        </Box>

        {isAdmin && (
          <Alert severity="info">
            Для каждой специализации можно выбрать несколько типов
            оборудования. Например, одна специализация может включать
            обслуживание котлов и газовых плит.
          </Alert>
        )}

        {isDispatcher && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Назначение мастеру
                </Typography>

                <TextField
                  select
                  fullWidth
                  label="Мастер"
                  value={selectedMasterId}
                  onChange={(event) =>
                    setSelectedMasterId(event.target.value)
                  }
                >
                  {masters.map((master) => (
                    <MenuItem key={master.id} value={master.id}>
                      {getUserName(master) ||
                        master.employeeNumber ||
                        master.id}
                      {master.employeeNumber
                        ? ` · № ${master.employeeNumber}`
                        : ""}
                    </MenuItem>
                  ))}
                </TextField>

                {masters.length === 0 && (
                  <Alert severity="warning">
                    Список мастеров пуст. Проверьте endpoint
                    GET /api/masters в user-service.
                  </Alert>
                )}

                {selectedMaster && (
                  <Typography color="text.secondary" variant="body2">
                    Выбран мастер: {getUserName(selectedMaster)}
                  </Typography>
                )}

                <Divider />

                <Typography fontWeight={600}>
                  Специализации
                </Typography>

                <Autocomplete
                  multiple
                  options={specializations}
                  value={specializations.filter((item) =>
                    assignedSpecializationIds.includes(item.id)
                  )}
                  onChange={(_, values) =>
                    setAssignedSpecializationIds(
                      values.map((item) => item.id)
                    )
                  }
                  getOptionLabel={(option) => option.name || ""}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disabled={!selectedMasterId}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Назначенные специализации"
                      placeholder="Выберите специализации"
                    />
                  )}
                />

                {assignedSpecializationIds.length > 0 && (
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    gap={1}
                  >
                    {specializations
                      .filter((item) =>
                        assignedSpecializationIds.includes(item.id)
                      )
                      .map((item) => (
                        <Chip
                          key={item.id}
                          label={item.name}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                  </Stack>
                )}

                <Box>
                  <Button
                    variant="contained"
                    onClick={handleSaveAssignments}
                    disabled={!selectedMasterId || saving}
                  >
                    Сохранить назначения
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        {(isAdmin || isDispatcher) && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Список специализаций
              </Typography>

              {specializations.length === 0 ? (
                <Alert severity="info">
                  Специализации пока не созданы.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Название</TableCell>
                        <TableCell>Типы оборудования</TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            Действия
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {specializations.map((specialization) => (
                        <TableRow key={specialization.id} hover>
                          <TableCell>
                            <Typography fontWeight={600}>
                              {specialization.name}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Stack
                              direction="row"
                              flexWrap="wrap"
                              gap={0.75}
                            >
                              {getSpecializationEquipmentNames(
                                specialization,
                                equipmentTypes
                              ).map((name, index) => (
                                <Chip
                                  key={`${specialization.id}-${index}`}
                                  size="small"
                                  label={name}
                                  variant="outlined"
                                />
                              ))}
                            </Stack>
                          </TableCell>

                          {isAdmin && (
                            <TableCell align="right">
                              <IconButton
                                aria-label="Редактировать специализацию"
                                onClick={() =>
                                  openEditDialog(specialization)
                                }
                              >
                                <EditOutlinedIcon />
                              </IconButton>

                              <IconButton
                                color="error"
                                aria-label="Удалить специализацию"
                                onClick={() =>
                                  setDeleteTarget(specialization)
                                }
                              >
                                <DeleteOutlineOutlinedIcon />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}

        {isEngineer && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                >
                  <EngineeringOutlinedIcon color="primary" />

                  <Typography variant="h6" fontWeight={700}>
                    Назначенные специализации
                  </Typography>
                </Stack>

                {mySpecializations.length === 0 ? (
                  <Alert severity="info">
                    Вам пока не назначены специализации.
                    Обратитесь к диспетчеру.
                  </Alert>
                ) : (
                  mySpecializations.map((specialization) => (
                    <Box key={specialization.id}>
                      <Typography fontWeight={600}>
                        {specialization.name}
                      </Typography>

                      <Stack
                        direction="row"
                        flexWrap="wrap"
                        gap={0.75}
                        sx={{ mt: 1 }}
                      >
                        {getSpecializationEquipmentNames(
                          specialization,
                          equipmentTypes
                        ).map((name, index) => (
                          <Chip
                            key={`${specialization.id}-${index}`}
                            label={name}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>

                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Создание и редактирование специализации — только ADMIN */}
      <Dialog
        open={dialogOpen && isAdmin}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingSpecialization
            ? "Редактирование специализации"
            : "Новая специализация"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              required
              label="Название специализации"
              value={form.name}
              inputProps={{ maxLength: 100 }}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />

            <Autocomplete
              multiple
              options={equipmentTypeOptions}
              value={equipmentTypeOptions.filter((option) =>
                form.equipmentTypeIds.includes(option.id)
              )}
              onChange={(_, values) =>
                setForm((current) => ({
                  ...current,
                  equipmentTypeIds: values.map((item) => item.id),
                }))
              }
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) =>
                option.id === value.id
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Типы оборудования"
                  placeholder="Выберите один или несколько типов"
                  helperText="Можно выбрать несколько типов оборудования"
                />
              )}
            />

            {equipmentTypes.length === 0 && (
              <Alert severity="warning">
                Сначала добавьте типы оборудования в разделе
                «Оборудование → Типы оборудования».
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Отмена
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveSpecialization}
            disabled={
              saving ||
              !form.name.trim() ||
              form.equipmentTypeIds.length === 0
            }
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Подтверждение удаления — только ADMIN */}
      <Dialog
        open={Boolean(deleteTarget) && isAdmin}
        onClose={() => !saving && setDeleteTarget(null)}
      >
        <DialogTitle>Удалить специализацию?</DialogTitle>

        <DialogContent>
          <Typography>
            Специализация «{deleteTarget?.name}» будет удалена.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={saving}
          >
            Отмена
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteSpecialization}
            disabled={saving}
          >
            {saving ? "Удаление..." : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notice.open}
        autoHideDuration={5000}
        onClose={() =>
          setNotice((current) => ({ ...current, open: false }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
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
