import { useEffect, useMemo, useState } from "react";

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
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import GroupIcon from "@mui/icons-material/Group";
import PeopleIcon from "@mui/icons-material/People";
import EngineeringIcon from "@mui/icons-material/Engineering";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import WorkIcon from "@mui/icons-material/Work";
import HomeIcon from "@mui/icons-material/Home";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";

import MainLayout from "../components/layout/MainLayout";

import { getCurrentProfile } from "../api/userApi";

import {
  getUsersByRole,
  getUserCard,
  setUserStatus,
  createClient,
  createEmployee,
  deleteUser,
} from "../api/adminUserApi";

import {
  getAllCities,
  getStreetsByCity,
  getHousesByStreet,
} from "../api/addressApi";

/* ========================================================= */
/* РОЛИ */
/* ========================================================= */

const roles = [
  {
    value: "CLIENT",
    label: "Клиенты",
    createLabel: "клиента",
    description: "Пользователи системы",
    icon: <PeopleIcon />,
  },
  {
    value: "ENGINEER",
    label: "Мастера",
    createLabel: "мастера",
    description: "Сотрудники сервисной компании",
    icon: <EngineeringIcon />,
  },
  {
    value: "DISPATCHER",
    label: "Диспетчеры",
    createLabel: "диспетчера",
    description: "Сотрудники диспетчерской службы",
    icon: <SupportAgentIcon />,
  },
  {
    value: "ADMIN",
    label: "Администраторы",
    createLabel: "администратора",
    description: "Администраторы системы",
    icon: <AdminPanelSettingsIcon />,
  },
];

const roleLabels = {
  CLIENT: "Клиент",
  ENGINEER: "Мастер",
  DISPATCHER: "Диспетчер",
  ADMIN: "Администратор",
};

const statusLabels = {
  AVAILABLE: "Доступен",
  BUSY: "Занят",
  OFFLINE: "Не в сети",
};

/* ========================================================= */
/* COMPONENT */
/* ========================================================= */

export default function UsersPage() {
  /* ========================================================= */
  /* ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ */
  /* ========================================================= */

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ========================================================= */
  /* СПИСОК ПОЛЬЗОВАТЕЛЕЙ */
  /* ========================================================= */

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [selectedRole, setSelectedRole] =
    useState("CLIENT");

  /* ========================================================= */
  /* КАРТОЧКА ПОЛЬЗОВАТЕЛЯ */
  /* ========================================================= */

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [cardOpen, setCardOpen] =
    useState(false);

  const [cardLoading, setCardLoading] =
    useState(false);

  const [cardError, setCardError] =
    useState("");

  /* ========================================================= */
  /* БЛОКИРОВКА / РАЗБЛОКИРОВКА */
  /* ========================================================= */

  const [statusLoading, setStatusLoading] =
    useState(false);

  const [statusError, setStatusError] =
    useState("");

  /* ========================================================= */
  /* УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ */
  /* ========================================================= */

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [deleteUserTarget, setDeleteUserTarget] =
    useState(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState("");

  /* ========================================================= */
  /* АДРЕС */
  /* ========================================================= */

  const [addressLoading, setAddressLoading] =
    useState(false);

  const [selectedAddress, setSelectedAddress] =
    useState({
      city: null,
      street: null,
      house: null,
    });

  /* ========================================================= */
  /* СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ */
  /* ========================================================= */

  const [createOpen, setCreateOpen] =
    useState(false);

  const [createLoading, setCreateLoading] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  const [createSuccess, setCreateSuccess] =
    useState("");

  const [createForm, setCreateForm] =
    useState({
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      phone: "",
      password: "",

      employeeNumber: "",
      department: "",
      specialization: "",
      position: "",
    });

  /* ========================================================= */
  /* СОЗДАННЫЙ СОТРУДНИК */
  /* ========================================================= */

  const [createdEmployee, setCreatedEmployee] =
    useState(null);

  const [passwordCopied, setPasswordCopied] =
    useState(false);

  /* ========================================================= */
  /* EFFECTS */
  /* ========================================================= */

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  /* ========================================================= */
  /* ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ */
  /* ========================================================= */

  const loadUser = async () => {
    try {
      const profile =
        await getCurrentProfile();

      setUser(profile);
    } catch (error) {
      console.error(
        "Не удалось загрузить текущего пользователя:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* ========================================================= */
  /* СПИСОК ПОЛЬЗОВАТЕЛЕЙ */
  /* ========================================================= */

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError("");

    try {
      const data =
        await getUsersByRole(
          selectedRole
        );

      setUsers(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Не удалось загрузить пользователей:",
        error
      );

      setUsers([]);

      setUsersError(
        error?.response?.data?.message ||
          "Не удалось загрузить список пользователей"
      );
    } finally {
      setUsersLoading(false);
    }
  };

  /* ========================================================= */
  /* ОТКРЫТИЕ КАРТОЧКИ */
  /* ========================================================= */

  const handleOpenUser = async (id) => {
    setCardOpen(true);
    setCardLoading(true);
    setCardError("");
    setStatusError("");

    setSelectedUser(null);

    setSelectedAddress({
      city: null,
      street: null,
      house: null,
    });

    try {
      const data =
        await getUserCard(id);

      setSelectedUser(data);

      /*
       * Для клиента отдельно
       * определяем человекочитаемый адрес.
       */
      if (
        data.role === "CLIENT" &&
        data.cityId &&
        data.streetId &&
        data.houseId
      ) {
        resolveUserAddress(data);
      }
    } catch (error) {
      console.error(
        "Не удалось загрузить карточку пользователя:",
        error
      );

      setCardError(
        error?.response?.data?.message ||
          "Не удалось загрузить данные пользователя"
      );
    } finally {
      setCardLoading(false);
    }
  };

  /* ========================================================= */
  /* ПОЛУЧЕНИЕ АДРЕСА */
  /* ========================================================= */

  const resolveUserAddress = async (
    selectedUserData
  ) => {
    setAddressLoading(true);

    try {
      /* ------------------------- */
      /* Город */
      /* ------------------------- */

      const cities =
        await getAllCities();

      const city =
        cities?.find(
          (item) =>
            String(item.id) ===
            String(
              selectedUserData.cityId
            )
        ) || null;

      /* ------------------------- */
      /* Улица */
      /* ------------------------- */

      let street = null;

      if (city) {
        const streets =
          await getStreetsByCity(
            selectedUserData.cityId
          );

        street =
          streets?.find(
            (item) =>
              String(item.id) ===
              String(
                selectedUserData.streetId
              )
          ) || null;
      }

      /* ------------------------- */
      /* Дом */
      /* ------------------------- */

      let house = null;

      if (street) {
        const houses =
          await getHousesByStreet(
            selectedUserData.streetId
          );

        house =
          houses?.find(
            (item) =>
              String(item.id) ===
              String(
                selectedUserData.houseId
              )
          ) || null;
      }

      setSelectedAddress({
        city,
        street,
        house,
      });
    } catch (error) {
      console.error(
        "Не удалось определить адрес пользователя:",
        error
      );
    } finally {
      setAddressLoading(false);
    }
  };

  /* ========================================================= */
  /* ЗАКРЫТИЕ КАРТОЧКИ */
  /* ========================================================= */

  const handleCloseCard = () => {
    if (statusLoading) {
      return;
    }

    setCardOpen(false);

    setSelectedUser(null);

    setCardError("");

    setStatusError("");

    setSelectedAddress({
      city: null,
      street: null,
      house: null,
    });
  };

  /* ========================================================= */
  /* БЛОКИРОВКА / РАЗБЛОКИРОВКА */
  /* ========================================================= */

  const handleChangeUserStatus = async () => {
    if (!selectedUser) {
      return;
    }

    setStatusLoading(true);
    setStatusError("");

    try {
      /*
       * Если сейчас enabled=true,
       * значит блокируем.
       *
       * Если enabled=false,
       * значит разблокируем.
       */
      const newEnabled =
        !selectedUser.enabled;

      const updatedUser =
        await setUserStatus(
          selectedUser.id,
          newEnabled
        );

      /*
       * Обновляем карточку.
       */
      setSelectedUser((prev) => ({
        ...prev,
        enabled:
          updatedUser.enabled,
      }));

      /*
       * Обновляем строку в таблице,
       * чтобы статус изменился
       * сразу без перезагрузки.
       */
      setUsers((prev) =>
        prev.map((item) =>
          item.id === selectedUser.id
            ? {
                ...item,
                enabled:
                  updatedUser.enabled,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Не удалось изменить статус пользователя:",
        error
      );

      setStatusError(
        error?.response?.data?.message ||
          "Не удалось изменить статус пользователя"
      );
    } finally {
      setStatusLoading(false);
    }
  };

  /* ========================================================= */
  /* УДАЛЕНИЕ — ОТКРЫТИЕ */
  /* ========================================================= */

  const handleOpenDelete = (item, event) => {
    /*
     * Не даём клику по корзине
     * открыть карточку пользователя.
     */
    event.stopPropagation();

    setDeleteUserTarget(item);
    setDeleteError("");
    setDeleteOpen(true);
  };

  /* ========================================================= */
  /* УДАЛЕНИЕ — ЗАКРЫТИЕ */
  /* ========================================================= */

  const handleCloseDelete = () => {
    if (deleteLoading) {
      return;
    }

    setDeleteOpen(false);
    setDeleteUserTarget(null);
    setDeleteError("");
  };

  /* ========================================================= */
  /* УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ */
  /* ========================================================= */

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      await deleteUser(deleteUserTarget.id);

      /*
       * Если удаляемый пользователь
       * открыт в карточке — закрываем её.
       */
      if (
        selectedUser?.id ===
        deleteUserTarget.id
      ) {
        setCardOpen(false);
        setSelectedUser(null);
      }

      setDeleteOpen(false);
      setDeleteUserTarget(null);

      /*
       * Обновляем таблицу после удаления.
       */
      await loadUsers();
    } catch (error) {
      console.error(
        "Не удалось удалить пользователя:",
        error
      );

      setDeleteError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Не удалось удалить пользователя"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ========================================================= */
  /* ТЕКУЩАЯ РОЛЬ */
  /* ========================================================= */

  const currentRole = useMemo(() => {
    return roles.find(
      (role) =>
        role.value === selectedRole
    );
  }, [selectedRole]);

  /* ========================================================= */
  /* СОЗДАНИЕ — ОТКРЫТИЕ */
  /* ========================================================= */

  const handleOpenCreate = () => {
    setCreateError("");
    setCreateSuccess("");

    setCreatedEmployee(null);
    setPasswordCopied(false);

    setCreateForm({
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      phone: "",
      password: "",

      employeeNumber: "",
      department: "",
      specialization: "",
      position: "",
    });

    setCreateOpen(true);
  };

  /* ========================================================= */
  /* СОЗДАНИЕ — ЗАКРЫТИЕ */
  /* ========================================================= */

  const handleCloseCreate = () => {
    if (createLoading) {
      return;
    }

    setCreateOpen(false);

    setCreateError("");
    setCreateSuccess("");

    setCreatedEmployee(null);
    setPasswordCopied(false);

    setCreateForm({
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      phone: "",
      password: "",

      employeeNumber: "",
      department: "",
      specialization: "",
      position: "",
    });
  };

  /* ========================================================= */
  /* ИЗМЕНЕНИЕ ФОРМЫ */
  /* ========================================================= */

  const handleCreateChange =
    (field) => (event) => {
      setCreateForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  /* ========================================================= */
  /* СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ */
  /* ========================================================= */

  const handleCreateUser = async () => {
    setCreateLoading(true);

    setCreateError("");
    setCreateSuccess("");

    setCreatedEmployee(null);
    setPasswordCopied(false);

    try {
      /* ===================================================== */
      /* КЛИЕНТ */
      /* ===================================================== */

      if (selectedRole === "CLIENT") {
        await createClient({
          firstName:
            createForm.firstName,

          lastName:
            createForm.lastName,

          middleName:
            createForm.middleName,

          email:
            createForm.email,

          phone:
            createForm.phone,

          password:
            createForm.password,
        });

        setCreateSuccess(
          "Клиент успешно создан"
        );

        await loadUsers();

        /*
         * Для клиента закрываем окно
         * после успешного создания.
         */
        setTimeout(() => {
          handleCloseCreate();
        }, 1000);

        return;
      }

      /* ===================================================== */
      /* СОТРУДНИК */
      /* ===================================================== */

      const response =
        await createEmployee({
          firstName:
            createForm.firstName,

          lastName:
            createForm.lastName,

          middleName:
            createForm.middleName,

          email:
            createForm.email,

          phone:
            createForm.phone,

          employeeNumber:
            createForm.employeeNumber,

          department:
            createForm.department,

          specialization:
            createForm.specialization,

          position:
            createForm.position,

          role: selectedRole,
        });

      /*
       * Backend возвращает:
       *
       * email
       * temporaryPassword
       * message
       *
       * Сохраняем response,
       * чтобы показать пароль администратору.
       */
      setCreatedEmployee(response);

      await loadUsers();
    } catch (error) {
      console.error(
        "Не удалось создать пользователя:",
        error
      );

      setCreateError(
        error?.response?.data?.message ||
          "Не удалось создать пользователя"
      );
    } finally {
      setCreateLoading(false);
    }
  };

  /* ========================================================= */
  /* КОПИРОВАНИЕ ПАРОЛЯ */
  /* ========================================================= */

  const handleCopyPassword =
    async () => {
      if (
        !createdEmployee?.temporaryPassword
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          createdEmployee.temporaryPassword
        );

        setPasswordCopied(true);

        setTimeout(() => {
          setPasswordCopied(false);
        }, 2000);
      } catch (error) {
        console.error(
          "Не удалось скопировать пароль:",
          error
        );
      }
    };

  /* ========================================================= */
  /* КОПИРОВАНИЕ ДАННЫХ ДЛЯ ВХОДА */
  /* ========================================================= */

  const handleCopyLoginData =
    async () => {
      if (!createdEmployee) {
        return;
      }

      const text = `Данные для входа в систему

Email: ${createdEmployee.email}
Временный пароль: ${createdEmployee.temporaryPassword}`;

      try {
        await navigator.clipboard.writeText(
          text
        );

        setPasswordCopied(true);

        setTimeout(() => {
          setPasswordCopied(false);
        }, 2000);
      } catch (error) {
        console.error(
          "Не удалось скопировать данные:",
          error
        );
      }
    };

  /* ========================================================= */
  /* LOADING */
  /* ========================================================= */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  /* ========================================================= */
  /* RENDER */
  /* ========================================================= */

  return (
    <MainLayout user={user}>
      <Box>
        {/* =================================================== */}
        {/* ЗАГОЛОВОК */}
        {/* =================================================== */}

        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#E8F0FE",
                color: "#2563EB",
              }}
            >
              <GroupIcon
                sx={{ fontSize: 28 }}
              />
            </Box>

            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  color: "#172033",
                }}
              >
                Пользователи
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Управление пользователями
                системы
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* =================================================== */}
        {/* КАТЕГОРИИ */}
        {/* =================================================== */}

        <Grid
          container
          spacing={2}
          sx={{ mb: 3 }}
        >
          {roles.map((role) => {
            const active =
              selectedRole ===
              role.value;

            return (
              <Grid
                key={role.value}
                size={{
                  xs: 12,
                  sm: 6,
                  lg: 3,
                }}
              >
                <Card
                  onClick={() =>
                    setSelectedRole(
                      role.value
                    )
                  }
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    cursor: "pointer",

                    border: active
                      ? "2px solid #2563EB"
                      : "1px solid #E5E7EB",

                    boxShadow: active
                      ? "0 8px 24px rgba(37, 99, 235, 0.12)"
                      : "0 2px 8px rgba(15, 23, 42, 0.04)",

                    transition:
                      "all 0.2s ease",

                    "&:hover": {
                      transform:
                        "translateY(-2px)",

                      boxShadow:
                        "0 8px 24px rgba(15, 23, 42, 0.08)",
                    },
                  }}
                >
                  <CardContent
                    sx={{ p: 2.5 }}
                  >
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          flexShrink: 0,
                          borderRadius: 2,
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          bgcolor: active
                            ? "#2563EB"
                            : "#F1F5F9",
                          color: active
                            ? "white"
                            : "#475569",
                        }}
                      >
                        {role.icon}
                      </Box>

                      <Box
                        sx={{
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          fontWeight={700}
                          sx={{
                            color:
                              "#172033",
                            mb: 0.3,
                          }}
                        >
                          {role.label}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {
                            role.description
                          }
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* =================================================== */}
        {/* ТАБЛИЦА */}
        {/* =================================================== */}

        <Card
          sx={{
            borderRadius: 3,
            border:
              "1px solid #E5E7EB",
            boxShadow:
              "0 2px 10px rgba(15, 23, 42, 0.04)",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Заголовок */}
            <Box
              sx={{
                px: 3,
                py: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                borderBottom:
                  "1px solid #E5E7EB",
                gap: 2,
              }}
            >
              <Box>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      color:
                        "#172033",
                    }}
                  >
                    {currentRole?.label}
                  </Typography>

                  <Chip
                    label={users.length}
                    size="small"
                    sx={{
                      bgcolor:
                        "#EEF2FF",
                      color:
                        "#2563EB",
                      fontWeight: 700,
                      minWidth: 30,
                    }}
                  />
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Список пользователей
                  выбранной категории
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
              >
                {/* Создать */}
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={
                    handleOpenCreate
                  }
                  sx={{
                    borderRadius: 2,
                    textTransform:
                      "none",
                    fontWeight: 600,
                    boxShadow: "none",
                    px: 2,

                    "&:hover": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Создать{" "}
                  {
                    currentRole?.createLabel
                  }
                </Button>

                {/* Обновить */}
                <Tooltip
                  title="Обновить список"
                >
                  <span>
                    <IconButton
                      onClick={
                        loadUsers
                      }
                      disabled={
                        usersLoading
                      }
                      sx={{
                        width: 42,
                        height: 42,
                        border:
                          "1px solid #E2E8F0",
                        borderRadius: 2,
                        color:
                          "#475569",

                        "&:hover": {
                          bgcolor:
                            "#F8FAFC",
                          color:
                            "#2563EB",
                          borderColor:
                            "#BFDBFE",
                        },
                      }}
                    >
                      {usersLoading ? (
                        <CircularProgress
                          size={20}
                        />
                      ) : (
                        <RefreshIcon />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Box>

            {/* Ошибка */}
            {usersError && (
              <Box sx={{ p: 3 }}>
                <Alert severity="error">
                  {usersError}
                </Alert>
              </Box>
            )}

            {/* Загрузка */}
            {usersLoading ? (
              <Box
                sx={{
                  minHeight: 300,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              /* Пусто */
              <Box sx={{ p: 3 }}>
                <Box
                  sx={{
                    minHeight: 300,
                    borderRadius: 2.5,
                    border:
                      "1px dashed #CBD5E1",
                    bgcolor:
                      "#F8FAFC",
                    display: "flex",
                    flexDirection:
                      "column",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    textAlign:
                      "center",
                    px: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius:
                        "50%",
                      bgcolor:
                        "#E8F0FE",
                      color:
                        "#2563EB",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      mb: 2,
                    }}
                  >
                    <GroupIcon
                      sx={{
                        fontSize: 32,
                      }}
                    />
                  </Box>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      color:
                        "#334155",
                      mb: 1,
                    }}
                  >
                    Пользователи
                    не найдены
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    В категории «
                    {currentRole?.label}
                    » пока нет
                    пользователей.
                  </Typography>
                </Box>
              </Box>
            ) : (
              /* Таблица */
              <Box
                sx={{
                  overflowX:
                    "auto",
                }}
              >
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >
                  <Box component="thead">
                    <Box
                      component="tr"
                      sx={{
                        bgcolor:
                          "#F8FAFC",
                        borderBottom:
                          "1px solid #E2E8F0",
                      }}
                    >
                      <TableHeader>
                        Пользователь
                      </TableHeader>

                      <TableHeader>
                        Email
                      </TableHeader>

                      <TableHeader>
                        Телефон
                      </TableHeader>

                      <TableHeader>
                        Статус
                      </TableHeader>

                      <Box
                        component="th"
                        sx={{
                          width: 100,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box component="tbody">
                    {users.map(
                      (item) => (
                        <Box
                          component="tr"
                          key={item.id}
                          onClick={() =>
                            handleOpenUser(
                              item.id
                            )
                          }
                          sx={{
                            cursor:
                              "pointer",
                            borderBottom:
                              "1px solid #F1F5F9",
                            transition:
                              "background-color 0.15s ease",

                            "&:hover": {
                              bgcolor:
                                "#F8FAFC",
                            },

                            "&:last-child":
                              {
                                borderBottom:
                                  "none",
                              },
                          }}
                        >
                          {/* Пользователь */}
                          <Box
                            component="td"
                            sx={{
                              px: 3,
                              py: 2,
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius:
                                    "50%",
                                  bgcolor:
                                    item.enabled
                                      ? "#E8F0FE"
                                      : "#F1F5F9",
                                  color:
                                    item.enabled
                                      ? "#2563EB"
                                      : "#64748B",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  flexShrink: 0,
                                }}
                              >
                                <PersonIcon
                                  sx={{
                                    fontSize:
                                      20,
                                  }}
                                />
                              </Box>

                              <Box>
                                <Typography
                                  fontWeight={
                                    600
                                  }
                                  sx={{
                                    color:
                                      "#172033",
                                    lineHeight:
                                      1.3,
                                  }}
                                >
                                  {
                                    item.lastName
                                  }{" "}
                                  {
                                    item.firstName
                                  }
                                </Typography>

                                {item.middleName && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {
                                      item.middleName
                                    }
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </Box>

                          {/* Email */}
                          <Box
                            component="td"
                            sx={{
                              px: 2,
                              py: 2,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  "#475569",
                              }}
                            >
                              {item.email}
                            </Typography>
                          </Box>

                          {/* Телефон */}
                          <Box
                            component="td"
                            sx={{
                              px: 2,
                              py: 2,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  "#475569",
                              }}
                            >
                              {item.phone ||
                                "Не указан"}
                            </Typography>
                          </Box>

                          {/* Статус */}
                          <Box
                            component="td"
                            sx={{
                              px: 2,
                              py: 2,
                            }}
                          >
                            <Chip
                              icon={
                                item.enabled ? (
                                  <LockOpenIcon />
                                ) : (
                                  <LockIcon />
                                )
                              }
                              label={
                                item.enabled
                                  ? "Активен"
                                  : "Заблокирован"
                              }
                              size="small"
                              sx={{
                                fontWeight:
                                  600,
                                bgcolor:
                                  item.enabled
                                    ? "#ECFDF5"
                                    : "#FEF2F2",
                                color:
                                  item.enabled
                                    ? "#059669"
                                    : "#DC2626",

                                "& .MuiChip-icon":
                                  {
                                    color:
                                      "inherit",
                                    fontSize:
                                      16,
                                  },
                              }}
                            />
                          </Box>

                          {/* Действия */}
                          <Box
                            component="td"
                            sx={{
                              px: 2,
                              py: 2,
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={0.5}
                              justifyContent="flex-end"
                              alignItems="center"
                            >
                              {/* Удалить */}
                              <Tooltip title="Удалить пользователя">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(event) =>
                                    handleOpenDelete(
                                      item,
                                      event
                                    )
                                  }
                                  disabled={
                                    deleteLoading &&
                                    deleteUserTarget?.id ===
                                      item.id
                                  }
                                  sx={{
                                    width: 34,
                                    height: 34,

                                    "&:hover": {
                                      bgcolor: "#FEF2F2",
                                    },
                                  }}
                                >
                                  {deleteLoading &&
                                  deleteUserTarget?.id ===
                                    item.id ? (
                                    <CircularProgress
                                      size={18}
                                      color="error"
                                    />
                                  ) : (
                                    <DeleteOutlineIcon
                                      fontSize="small"
                                    />
                                  )}
                                </IconButton>
                              </Tooltip>

                              {/* Открыть карточку */}
                              <Typography
                                sx={{
                                  color: "#94A3B8",
                                  fontSize: 22,
                                  transition:
                                    "transform 0.15s ease",
                                  "tr:hover &": {
                                    color: "#2563EB",
                                    transform:
                                      "translateX(3px)",
                                  },
                                }}
                              >
                                →
                              </Typography>
                            </Stack>
                          </Box>
                        </Box>
                      )
                    )}
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* =================================================== */}
      {/* СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ */}
      {/* =================================================== */}

      <Dialog
        open={createOpen}
        onClose={
          createdEmployee
            ? undefined
            : handleCloseCreate
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                {createdEmployee
                  ? "Сотрудник создан"
                  : `Создание ${currentRole?.createLabel}`}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {createdEmployee
                  ? "Данные для первого входа"
                  : currentRole?.label}
              </Typography>
            </Box>

            {!createdEmployee && (
              <IconButton
                onClick={
                  handleCloseCreate
                }
                disabled={
                  createLoading
                }
              >
                <CloseIcon />
              </IconButton>
            )}
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          {/* ================================================= */}
          {/* УСПЕШНО СОЗДАННЫЙ СОТРУДНИК */}
          {/* ================================================= */}

          {createdEmployee ? (
            <Stack spacing={3}>
              <Box
                sx={{
                  textAlign:
                    "center",
                  py: 1,
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius:
                      "50%",
                    bgcolor:
                      "#DCFCE7",
                    color:
                      "#16A34A",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <CheckIcon
                    sx={{
                      fontSize: 34,
                    }}
                  />
                </Box>

                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Сотрудник
                  успешно создан
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                  }}
                >
                  Передайте сотруднику
                  данные для первого
                  входа в систему.
                </Typography>
              </Box>

              {/* Email */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor:
                    "#F8FAFC",
                  border:
                    "1px solid #E2E8F0",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Email
                </Typography>

                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{
                    mt: 0.5,
                  }}
                >
                  {
                    createdEmployee.email
                  }
                </Typography>
              </Box>

              {/* Пароль */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor:
                    "#FFF7ED",
                  border:
                    "1px solid #FED7AA",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Временный
                      пароль
                    </Typography>

                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        mt: 0.5,
                        fontFamily:
                          "monospace",
                        letterSpacing:
                          1,
                        wordBreak:
                          "break-all",
                      }}
                    >
                      {
                        createdEmployee.temporaryPassword
                      }
                    </Typography>
                  </Box>

                  <Tooltip
                    title={
                      passwordCopied
                        ? "Скопировано"
                        : "Скопировать пароль"
                    }
                  >
                    <IconButton
                      onClick={
                        handleCopyPassword
                      }
                      sx={{
                        flexShrink: 0,
                      }}
                    >
                      {passwordCopied ? (
                        <CheckIcon
                          color="success"
                        />
                      ) : (
                        <ContentCopyIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {/* Скопировать всё */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={
                  passwordCopied ? (
                    <CheckIcon />
                  ) : (
                    <ContentCopyIcon />
                  )
                }
                onClick={
                  handleCopyLoginData
                }
              >
                {passwordCopied
                  ? "Скопировано"
                  : "Скопировать данные для входа"}
              </Button>

              {/* Предупреждение */}
              <Alert severity="warning">
                Сохраните пароль сейчас.
                После закрытия этого окна
                повторно получить этот
                временный пароль через
                данную страницу будет нельзя.
              </Alert>
            </Stack>
          ) : (
            /* ================================================= */
            /* ФОРМА СОЗДАНИЯ */
            /* ================================================= */

            <Stack spacing={2}>
              {createError && (
                <Alert severity="error">
                  {createError}
                </Alert>
              )}

              {createSuccess && (
                <Alert severity="success">
                  {createSuccess}
                </Alert>
              )}

              <Grid
                container
                spacing={2}
              >
                {/* Фамилия */}
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    fullWidth
                    required
                    label="Фамилия"
                    value={
                      createForm.lastName
                    }
                    onChange={handleCreateChange(
                      "lastName"
                    )}
                  />
                </Grid>

                {/* Имя */}
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    fullWidth
                    required
                    label="Имя"
                    value={
                      createForm.firstName
                    }
                    onChange={handleCreateChange(
                      "firstName"
                    )}
                  />
                </Grid>

                {/* Отчество */}
                <Grid
                  size={{ xs: 12 }}
                >
                  <TextField
                    fullWidth
                    label="Отчество"
                    value={
                      createForm.middleName
                    }
                    onChange={handleCreateChange(
                      "middleName"
                    )}
                  />
                </Grid>

                {/* Email */}
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    fullWidth
                    required
                    label="Email"
                    type="email"
                    value={
                      createForm.email
                    }
                    onChange={handleCreateChange(
                      "email"
                    )}
                  />
                </Grid>

                {/* Телефон */}
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <TextField
                    fullWidth
                    required
                    label="Телефон"
                    value={
                      createForm.phone
                    }
                    onChange={handleCreateChange(
                      "phone"
                    )}
                  />
                </Grid>

                {/* ================================================= */}
                {/* КЛИЕНТ */}
                {/* ================================================= */}

                {selectedRole ===
                  "CLIENT" && (
                  <Grid
                    size={{ xs: 12 }}
                  >
                    <TextField
                      fullWidth
                      required
                      label="Пароль"
                      type="password"
                      value={
                        createForm.password
                      }
                      onChange={handleCreateChange(
                        "password"
                      )}
                      helperText="Пароль для входа клиента в систему"
                    />
                  </Grid>
                )}

                {/* ================================================= */}
                {/* СОТРУДНИК */}
                {/* ================================================= */}

                {selectedRole !==
                  "CLIENT" && (
                  <Grid
                    size={{ xs: 12 }}
                  >
                    <TextField
                      fullWidth
                      required
                      label="Табельный номер"
                      value={
                        createForm.employeeNumber
                      }
                      onChange={handleCreateChange(
                        "employeeNumber"
                      )}
                    />
                  </Grid>
                )}

                {/* ================================================= */}
                {/* МАСТЕР */}
                {/* ================================================= */}

                {selectedRole ===
                  "ENGINEER" && (
                  <Grid
                    size={{ xs: 12 }}
                  >
                    <TextField
                      fullWidth
                      label="Специализация"
                      value={
                        createForm.specialization
                      }
                      onChange={handleCreateChange(
                        "specialization"
                      )}
                      placeholder="Например: Газовые котлы"
                    />
                  </Grid>
                )}

                {/* ================================================= */}
                {/* ДИСПЕТЧЕР */}
                {/* ================================================= */}

                {selectedRole ===
                  "DISPATCHER" && (
                  <Grid
                    size={{ xs: 12 }}
                  >
                    <TextField
                      fullWidth
                      label="Отдел"
                      value={
                        createForm.department
                      }
                      onChange={handleCreateChange(
                        "department"
                      )}
                      placeholder="Например: Диспетчерская служба"
                    />
                  </Grid>
                )}

                {/* ================================================= */}
                {/* АДМИНИСТРАТОР */}
                {/* ================================================= */}

                {selectedRole ===
                  "ADMIN" && (
                  <Grid
                    size={{ xs: 12 }}
                  >
                    <TextField
                      fullWidth
                      label="Должность"
                      value={
                        createForm.position
                      }
                      onChange={handleCreateChange(
                        "position"
                      )}
                      placeholder="Например: Администратор"
                    />
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>

        <Divider />

        <DialogActions
          sx={{
            p: 2.5,
            gap: 1,
          }}
        >
          {createdEmployee ? (
            <Button
              variant="contained"
              onClick={
                handleCloseCreate
              }
            >
              Готово
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={
                  handleCloseCreate
                }
                disabled={
                  createLoading
                }
              >
                Отмена
              </Button>

              <Button
                variant="contained"
                startIcon={
                  createLoading ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  ) : (
                    <AddIcon />
                  )
                }
                onClick={
                  handleCreateUser
                }
                disabled={
                  createLoading
                }
                sx={{
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow:
                      "none",
                  },
                }}
              >
                {createLoading
                  ? "Создание..."
                  : "Создать"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* =================================================== */}
      {/* КАРТОЧКА ПОЛЬЗОВАТЕЛЯ */}
      {/* =================================================== */}

      <Dialog
        open={cardOpen}
        onClose={
          statusLoading
            ? undefined
            : handleCloseCard
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Карточка пользователя
              </Typography>

              {selectedUser && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {
                    roleLabels[
                      selectedUser.role
                    ] ||
                    selectedUser.role
                  }
                </Typography>
              )}
            </Box>

            <IconButton
              onClick={
                handleCloseCard
              }
              disabled={
                statusLoading
              }
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          {/* Загрузка */}
          {cardLoading ? (
            <Box
              sx={{
                minHeight: 300,
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : cardError ? (
            <Alert severity="error">
              {cardError}
            </Alert>
          ) : selectedUser ? (
            <Stack spacing={3}>
              {/* Ошибка блокировки */}
              {statusError && (
                <Alert severity="error">
                  {statusError}
                </Alert>
              )}

              {/* ================================================= */}
              {/* ШАПКА */}
              {/* ================================================= */}

              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor:
                    selectedUser.enabled
                      ? "#F8FAFC"
                      : "#FEF2F2",
                  border:
                    selectedUser.enabled
                      ? "1px solid #E2E8F0"
                      : "1px solid #FECACA",
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius:
                        "50%",
                      bgcolor:
                        selectedUser.enabled
                          ? "#E8F0FE"
                          : "#FEE2E2",
                      color:
                        selectedUser.enabled
                          ? "#2563EB"
                          : "#DC2626",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      flexShrink: 0,
                    }}
                  >
                    {selectedUser.enabled ? (
                      <PersonIcon
                        sx={{
                          fontSize: 32,
                        }}
                      />
                    ) : (
                      <LockIcon
                        sx={{
                          fontSize: 30,
                        }}
                      />
                    )}
                  </Box>

                  <Box
                    sx={{
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        color:
                          "#172033",
                      }}
                    >
                      {
                        selectedUser.lastName
                      }{" "}
                      {
                        selectedUser.firstName
                      }
                    </Typography>

                    {selectedUser.middleName && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {
                          selectedUser.middleName
                        }
                      </Typography>
                    )}

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      <Chip
                        label={
                          roleLabels[
                            selectedUser
                              .role
                          ] ||
                          selectedUser.role
                        }
                        size="small"
                        sx={{
                          bgcolor:
                            "#EEF2FF",
                          color:
                            "#2563EB",
                          fontWeight: 600,
                        }}
                      />

                      <Chip
                        label={
                          selectedUser.enabled
                            ? "Активен"
                            : "Заблокирован"
                        }
                        size="small"
                        icon={
                          selectedUser.enabled ? (
                            <LockOpenIcon />
                          ) : (
                            <LockIcon />
                          )
                        }
                        sx={{
                          bgcolor:
                            selectedUser.enabled
                              ? "#ECFDF5"
                              : "#FEF2F2",
                          color:
                            selectedUser.enabled
                              ? "#059669"
                              : "#DC2626",
                          fontWeight: 600,

                          "& .MuiChip-icon":
                            {
                              color:
                                "inherit",
                              fontSize:
                                16,
                            },
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              {/* ================================================= */}
              {/* ЛИЧНЫЕ ДАННЫЕ */}
              {/* ================================================= */}

              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{
                    mb: 1.5,
                    color:
                      "#172033",
                  }}
                >
                  Личные данные
                </Typography>

                <Stack spacing={1.2}>
                  <InfoRow
                    icon={
                      <EmailIcon />
                    }
                    label="Email"
                    value={
                      selectedUser.email ||
                      "Не указан"
                    }
                  />

                  <InfoRow
                    icon={
                      <PhoneIcon />
                    }
                    label="Телефон"
                    value={
                      selectedUser.phone ||
                      "Не указан"
                    }
                  />

                  <InfoRow
                    icon={
                      <BadgeIcon />
                    }
                    label="ID пользователя"
                    value={
                      selectedUser.id
                    }
                  />

                  <InfoRow
                    icon={
                      <WorkIcon />
                    }
                    label="Статус аккаунта"
                    value={
                      selectedUser.enabled
                        ? "Активен"
                        : "Заблокирован"
                    }
                  />
                </Stack>
              </Box>

              {/* ================================================= */}
              {/* КЛИЕНТ */}
              {/* ================================================= */}

              {selectedUser.role ===
                "CLIENT" && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{
                      mb: 1.5,
                      color:
                        "#172033",
                    }}
                  >
                    Адрес
                  </Typography>

                  {addressLoading ? (
                    <Box
                      sx={{
                        py: 3,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                      }}
                    >
                      <CircularProgress
                        size={24}
                      />
                    </Box>
                  ) : (
                    <Stack spacing={1.2}>
                      <InfoRow
                        icon={
                          <HomeIcon />
                        }
                        label="Город"
                        value={
                          selectedAddress
                            .city
                            ?.name ||
                          "Не указан"
                        }
                      />

                      <InfoRow
                        icon={
                          <HomeIcon />
                        }
                        label="Улица"
                        value={
                          selectedAddress
                            .street
                            ?.name ||
                          "Не указана"
                        }
                      />

                      <InfoRow
                        icon={
                          <HomeIcon />
                        }
                        label="Дом"
                        value={
                          selectedAddress
                            .house
                            ?.number ||
                          "Не указан"
                        }
                      />

                      <InfoRow
                        icon={
                          <HomeIcon />
                        }
                        label="Квартира"
                        value={
                          selectedUser.apartment ||
                          "Не указана"
                        }
                      />
                    </Stack>
                  )}
                </Box>
              )}

              {/* ================================================= */}
              {/* МАСТЕР */}
              {/* ================================================= */}

              {selectedUser.role ===
                "ENGINEER" && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{
                      mb: 1.5,
                      color:
                        "#172033",
                    }}
                  >
                    Служебная информация
                  </Typography>

                  <Stack spacing={1.2}>
                    <InfoRow
                      icon={
                        <BadgeIcon />
                      }
                      label="Табельный номер"
                      value={
                        selectedUser.employeeNumber ||
                        "Не указан"
                      }
                    />

                    <InfoRow
                      icon={
                        <WorkIcon />
                      }
                      label="Специализация"
                      value={
                        selectedUser.specialization ||
                        "Не указана"
                      }
                    />

                    <InfoRow
                      icon={
                        <WorkIcon />
                      }
                      label="Статус мастера"
                      value={
                        statusLabels[
                          selectedUser.status
                        ] ||
                        selectedUser.status ||
                        "Не указан"
                      }
                    />

                    <InfoRow
                      icon={
                        <WorkIcon />
                      }
                      label="Отдел"
                      value={
                        selectedUser.department ||
                        "Не указан"
                      }
                    />

                    <InfoRow
                      icon={
                        <WorkIcon />
                      }
                      label="Должность"
                      value={
                        selectedUser.position ||
                        "Не указана"
                      }
                    />
                  </Stack>
                </Box>
              )}

              {/* ================================================= */}
              {/* ДИСПЕТЧЕР */}
              {/* ================================================= */}

              {selectedUser.role ===
                "DISPATCHER" && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{
                      mb: 1.5,
                      color:
                        "#172033",
                    }}
                  >
                    Служебная информация
                  </Typography>

                  <Stack spacing={1.2}>
                    <InfoRow
                      icon={
                        <BadgeIcon />
                      }
                      label="Табельный номер"
                      value={
                        selectedUser.employeeNumber ||
                        "Не указан"
                      }
                    />

                    <InfoRow
                      icon={
                        <WorkIcon />
                      }
                      label="Отдел"
                      value={
                        selectedUser.department ||
                        "Не указан"
                      }
                    />

                    <InfoRow
                      icon={
                        <WorkIcon />
                      }
                      label="Должность"
                      value={
                        selectedUser.position ||
                        "Не указана"
                      }
                    />
                  </Stack>
                </Box>
              )}

              {/* ================================================= */}
              {/* АДМИНИСТРАТОР */}
              {/* ================================================= */}

              {selectedUser.role ===
                "ADMIN" && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{
                      mb: 1.5,
                      color:
                        "#172033",
                    }}
                  >
                    Служебная информация
                  </Typography>

                  <Stack spacing={1.2}>
                    <InfoRow
                      icon={
                        <BadgeIcon />
                      }
                      label="Табельный номер"
                      value={
                        selectedUser.employeeNumber ||
                        "Не указан"
                      }
                    />

                    <InfoRow
                      icon={
                        <WorkIcon />
                      }
                      label="Должность"
                      value={
                        selectedUser.position ||
                        "Не указана"
                      }
                    />

                    <InfoRow
                      icon={
                        <WorkIcon />
                      }
                      label="Отдел"
                      value={
                        selectedUser.department ||
                        "Не указан"
                      }
                    />
                  </Stack>
                </Box>
              )}
            </Stack>
          ) : null}
        </DialogContent>

        <Divider />

        {/* =================================================== */}
        {/* КНОПКИ КАРТОЧКИ */}
        {/* =================================================== */}

        <DialogActions
          sx={{
            p: 2,
            gap: 1,
          }}
        >
          <Button
            onClick={
              handleCloseCard
            }
            variant="outlined"
            disabled={
              statusLoading
            }
          >
            Закрыть
          </Button>

          {selectedUser && (
            <Button
              onClick={
                handleChangeUserStatus
              }
              variant={
                selectedUser.enabled
                  ? "outlined"
                  : "contained"
              }
              color={
                selectedUser.enabled
                  ? "error"
                  : "success"
              }
              disabled={
                statusLoading
              }
              startIcon={
                statusLoading ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : selectedUser.enabled ? (
                  <LockIcon />
                ) : (
                  <LockOpenIcon />
                )
              }
            >
              {statusLoading
                ? "Сохранение..."
                : selectedUser.enabled
                  ? "Заблокировать"
                  : "Разблокировать"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* =================================================== */}
      {/* ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ */}
      {/* =================================================== */}

      <Dialog
        open={deleteOpen}
        onClose={handleCloseDelete}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            px: 3,
            pt: 3,
            pb: 1.5,
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#FEF2F2",
                color: "#DC2626",
              }}
            >
              <DeleteOutlineIcon />
            </Box>

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Удалить пользователя?
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            py: 2,
          }}
        >
          {deleteUserTarget && (
            <Box>
              <Typography
                variant="body1"
                sx={{
                  color: "#334155",
                  mb: 1.5,
                }}
              >
                Вы действительно хотите удалить
                пользователя:
              </Typography>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  mb: 2,
                }}
              >
                <Typography
                  fontWeight={700}
                  sx={{
                    color: "#172033",
                  }}
                >
                  {deleteUserTarget.lastName}{" "}
                  {deleteUserTarget.firstName}
                  {deleteUserTarget.middleName
                    ? ` ${deleteUserTarget.middleName}`
                    : ""}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {deleteUserTarget.email}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    display: "block",
                  }}
                >
                  {roleLabels[
                    deleteUserTarget.role
                  ] || deleteUserTarget.role}
                </Typography>
              </Box>

              <Alert severity="warning">
                Это действие нельзя отменить. Учетная
                запись и профиль пользователя будут
                удалены.
              </Alert>

              {deleteError && (
                <Alert
                  severity="error"
                  sx={{ mt: 2 }}
                >
                  {deleteError}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
          }}
        >
          <Button
            onClick={handleCloseDelete}
            variant="outlined"
            disabled={deleteLoading}
          >
            Отмена
          </Button>

          <Button
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            startIcon={
              deleteLoading ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <DeleteOutlineIcon />
              )
            }
          >
            {deleteLoading
              ? "Удаление..."
              : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}

/* ========================================================= */
/* TABLE HEADER */
/* ========================================================= */

function TableHeader({
  children,
}) {
  return (
    <Box
      component="th"
      sx={{
        textAlign: "left",
        px: 2,
        py: 1.8,
        color: "#64748B",
        fontSize: 12,
        fontWeight: 700,
        textTransform:
          "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

/* ========================================================= */
/* INFO ROW */
/* ========================================================= */

function InfoRow({
  icon,
  label,
  value,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems:
          "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        bgcolor:
          "#F8FAFC",
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.5,
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          bgcolor:
            "#E8F0FE",
          color:
            "#2563EB",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box
        sx={{
          minWidth: 0,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
        >
          {label}
        </Typography>

        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            color:
              "#334155",
            overflow:
              "hidden",
            textOverflow:
              "ellipsis",
            wordBreak:
              "break-word",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}