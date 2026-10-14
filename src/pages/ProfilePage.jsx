import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";
import MainLayout from "../components/layout/MainLayout";
import {
  getCurrentProfile,
  updateProfile,
  uploadAvatar,
} from "../api/userApi";
import {
  getAllCities,
  getStreetsByCity,
  getHousesByStreet,
} from "../api/addressApi";
function ProfilePage() {
  const fileInput = useRef(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [originalUser, setOriginalUser] = useState(null);
  // Каскадный выбор адреса клиента.
  const [cities, setCities] = useState([]);
  const [streets, setStreets] = useState([]);
  const [houses, setHouses] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedStreetId, setSelectedStreetId] = useState("");
  const [selectedHouseId, setSelectedHouseId] = useState("");
  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    setLoading(true);
    setPageError("");
    try {
      const profile = await getCurrentProfile();
      setUser(profile);
      setOriginalUser(profile);
      const cityList = await getAllCities();
      setCities(Array.isArray(cityList) ? cityList : []);
      // Восстанавливаем адрес клиента.
      if (profile.cityId) {
        setSelectedCityId(profile.cityId);
        const streetList = await getStreetsByCity(profile.cityId);
        setStreets(Array.isArray(streetList) ? streetList : []);
        if (profile.streetId) {
          setSelectedStreetId(profile.streetId);
          const houseList = await getHousesByStreet(profile.streetId);
          setHouses(Array.isArray(houseList) ? houseList : []);
          if (profile.houseId) {
            setSelectedHouseId(profile.houseId);
          }
        }
      }
    } catch (error) {
      console.error("Не удалось загрузить профиль:", error);
      setPageError(
        error?.response?.data?.message ||
          "Не удалось загрузить профиль пользователя."
      );
    } finally {
      setLoading(false);
    }
  };
  const changeField = (field, value) => {
    setUser((previous) => ({
      ...previous,
      [field]: value,
    }));
  };
  // ---------- Каскад адреса ----------
  const handleCityChange = async (cityId) => {
    setSelectedCityId(cityId);
    setSelectedStreetId("");
    setSelectedHouseId("");
    setUser((previous) => ({
      ...previous,
      cityId,
      streetId: null,
      houseId: null,
    }));
    try {
      const streetList = cityId
        ? await getStreetsByCity(cityId)
        : [];
      setStreets(Array.isArray(streetList) ? streetList : []);
      setHouses([]);
    } catch (error) {
      console.error("Не удалось загрузить улицы:", error);
      setPageError("Не удалось загрузить улицы выбранного города.");
    }
  };
  const handleStreetChange = async (streetId) => {
    setSelectedStreetId(streetId);
    setSelectedHouseId("");
    setUser((previous) => ({
      ...previous,
      streetId,
      houseId: null,
    }));
    try {
      const houseList = streetId
        ? await getHousesByStreet(streetId)
        : [];
      setHouses(Array.isArray(houseList) ? houseList : []);
    } catch (error) {
      console.error("Не удалось загрузить дома:", error);
      setPageError("Не удалось загрузить дома выбранной улицы.");
    }
  };
  const handleHouseChange = (houseId) => {
    setSelectedHouseId(houseId);
    setUser((previous) => ({
      ...previous,
      houseId,
    }));
  };
  // ---------- Фотография ----------
  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setUser((previous) => ({
      ...previous,
      avatarPreview: previewUrl,
    }));
    try {
      await uploadAvatar(file);
      setUser((previous) => ({
        ...previous,
        hasAvatar: true,
      }));
      setOriginalUser((previous) => ({
        ...previous,
        hasAvatar: true,
      }));
    } catch (error) {
      console.error("Не удалось загрузить фотографию:", error);
      setPageError(
        error?.response?.data?.message ||
          "Не удалось загрузить фотографию."
      );
    } finally {
      // Позволяем повторно выбрать тот же файл.
      event.target.value = "";
    }
  };
  // ---------- Сохранение профиля ----------
  const handleSave = async () => {
    setPageError("");
    try {
      // В запросе нет zoneId и zones.
      // Назначение зон выполняется только на отдельной странице.
      const payload = {
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        phone: user.phone,
      };
      // Адрес изменяется через профиль только для клиента.
      if (user.role === "CLIENT") {
        payload.houseId = selectedHouseId || null;
        payload.apartment = user.apartment || "";
      }
      const updated = await updateProfile(payload);
      // Сохраняем зоны из загруженного профиля, даже если ответ
      // обновления не содержит поле zones.
      const merged = {
        ...user,
        ...updated,
        zones: user.zones || [],
      };
      setUser(merged);
      setOriginalUser(merged);
      setEditMode(false);
      window.alert("Профиль успешно сохранён");
    } catch (error) {
      console.error("Не удалось сохранить профиль:", error);
      setPageError(
        error?.response?.data?.message ||
          "Ошибка сохранения профиля."
      );
    }
  };
  // ---------- Отмена редактирования ----------
  const handleCancel = async () => {
    if (!originalUser) {
      setEditMode(false);
      return;
    }
    setUser(originalUser);
    setSelectedCityId(originalUser.cityId || "");
    setSelectedStreetId(originalUser.streetId || "");
    setSelectedHouseId(originalUser.houseId || "");
    try {
      if (originalUser.cityId) {
        const streetList = await getStreetsByCity(originalUser.cityId);
        setStreets(Array.isArray(streetList) ? streetList : []);
        if (originalUser.streetId) {
          const houseList = await getHousesByStreet(originalUser.streetId);
          setHouses(Array.isArray(houseList) ? houseList : []);
        } else {
          setHouses([]);
        }
      } else {
        setStreets([]);
        setHouses([]);
      }
    } catch (error) {
      console.error("Не удалось восстановить адрес:", error);
    }
    setPageError("");
    setEditMode(false);
  };
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  if (!user) {
    return (
      <MainLayout user={user}>
        <Alert severity="error">
          {pageError || "Не удалось загрузить профиль."}
        </Alert>
      </MainLayout>
    );
  }
  const roleLabels = {
    CLIENT: "Клиент",
    ENGINEER: "Мастер",
    DISPATCHER: "Диспетчер",
    ADMIN: "Администратор",
  };
  const roleLabel = roleLabels[user.role] || user.role || "Не указана";
  return (
    <MainLayout user={user}>
      <Box sx={{ width: "100%" }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Профиль
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Управление личными данными пользователя
        </Typography>
        {pageError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setPageError("")}
          >
            {pageError}
          </Alert>
        )}
        <Grid container spacing={3}>
          {/* Левая карточка профиля */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Card
              sx={{
                borderRadius: 4,
                height: "100%",
                position: "sticky",
                top: 24,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: 90,
                  background:
                    "linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)",
                }}
              />
              <CardContent sx={{ mt: -7 }}>
                <Stack alignItems="center" spacing={2}>
                  <Avatar
                    src={
                      user.avatarPreview ||
                      (user.hasAvatar
                        ? "http://localhost:8082/api/profile/me/avatar"
                        : "")
                    }
                    sx={{
                      width: 130,
                      height: 130,
                      border: "5px solid white",
                      boxShadow: "0 8px 20px rgba(0,0,0,.18)",
                      bgcolor: "#2563EB",
                      fontSize: 52,
                    }}
                  >
                    {user.firstName?.charAt(0)}
                  </Avatar>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight={700}>
                      {user.lastName} {user.firstName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.middleName}
                    </Typography>
                  </Box>
                  <Chip
                    label={roleLabel}
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  />
                  <Divider sx={{ width: "100%" }} />
                  <Box sx={{ width: "100%" }}>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Фамилия
                        </Typography>
                        <Typography fontWeight={600}>
                          {user.lastName || "—"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Имя
                        </Typography>
                        <Typography fontWeight={600}>
                          {user.firstName || "—"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Отчество
                        </Typography>
                        <Typography fontWeight={600}>
                          {user.middleName || "—"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Тип профиля
                        </Typography>
                        <Typography fontWeight={700} color="primary">
                          {roleLabel}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PhotoCameraIcon />}
                    onClick={() => fileInput.current?.click()}
                    sx={{
                      mt: 1,
                      borderRadius: 3,
                      py: 1.2,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Сменить фото
                  </Button>
                  <input
                    hidden
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatar}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          {/* Правая часть профиля */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Stack spacing={3}>
              {/* Персональные данные */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700}>
                    Персональные данные
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Фамилия"
                        disabled={!editMode}
                        value={user.lastName || ""}
                        onChange={(event) =>
                          changeField("lastName", event.target.value)
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Имя"
                        disabled={!editMode}
                        value={user.firstName || ""}
                        onChange={(event) =>
                          changeField("firstName", event.target.value)
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Отчество"
                        disabled={!editMode}
                        value={user.middleName || ""}
                        onChange={(event) =>
                          changeField("middleName", event.target.value)
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Телефон"
                        disabled={!editMode}
                        value={user.phone || ""}
                        onChange={(event) =>
                          changeField("phone", event.target.value)
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        disabled
                        label="Email"
                        value={user.email || ""}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              {/* Адрес клиента */}
              {user.role === "CLIENT" && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700}>
                      Адрес проживания
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Город</InputLabel>
                          <Select
                            value={selectedCityId}
                            label="Город"
                            disabled={!editMode}
                            onChange={(event) =>
                              handleCityChange(event.target.value)
                            }
                          >
                            {cities.map((city) => (
                              <MenuItem key={city.id} value={city.id}>
                                {city.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Улица</InputLabel>
                          <Select
                            value={selectedStreetId}
                            label="Улица"
                            disabled={!editMode || !selectedCityId}
                            onChange={(event) =>
                              handleStreetChange(event.target.value)
                            }
                          >
                            {streets.map((street) => (
                              <MenuItem key={street.id} value={street.id}>
                                {street.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Дом</InputLabel>
                          <Select
                            value={selectedHouseId}
                            label="Дом"
                            disabled={!editMode || !selectedStreetId}
                            onChange={(event) =>
                              handleHouseChange(event.target.value)
                            }
                          >
                            {houses.map((house) => (
                              <MenuItem key={house.id} value={house.id}>
                                {house.number}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Квартира"
                          disabled={!editMode}
                          value={user.apartment || ""}
                          onChange={(event) =>
                            changeField("apartment", event.target.value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
              {/* Рабочая информация мастера */}
              {user.role === "ENGINEER" && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Typography variant="h6" fontWeight={700}>
                      Рабочая информация
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Должность"
                          value={user.position || ""}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Табельный номер"
                          value={user.employeeNumber || ""}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Статус"
                          value={user.status || ""}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Специализация"
                          value={
                            Array.isArray(user.specializations) &&
                            user.specializations.some((specialization) => specialization?.name)
                              ? user.specializations
                                  .filter((specialization) => specialization?.name)
                                  .map((specialization) => specialization.name)
                                  .join(", ")
                              : user.specialization || "Специализация не назначена"
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Зоны обслуживания"
                          value={
                            Array.isArray(user.zones) && user.zones.some((zone) => zone?.name)
                              ? user.zones
                                  .filter((zone) => zone?.name)
                                  .map((zone) => zone.name)
                                  .join(", ")
                              : "Зона не назначена"
                          }
                         
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
              {/* Рабочая информация диспетчера */}
              {user.role === "DISPATCHER" && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700}>
                      Рабочая информация
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Должность"
                          value={user.position || ""}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Отдел"
                          value={user.department || ""}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Табельный номер"
                          value={user.employeeNumber || ""}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Статус"
                          value={user.status || ""}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
              {/* Рабочая информация администратора */}
              {user.role === "ADMIN" && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700}>
                      Рабочая информация
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Должность"
                          value={user.position || ""}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Отдел"
                          value={user.department || ""}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Табельный номер"
                          value={user.employeeNumber || ""}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Роль"
                          value={roleLabel}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
              {/* Кнопки редактирования */}
              <Box
                display="flex"
                justifyContent="flex-end"
                gap={2}
                flexWrap="wrap"
              >
                {!editMode ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setEditMode(true)}
                  >
                    Редактировать профиль
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="large"
                      onClick={handleCancel}
                    >
                      Отмена
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                    >
                      Сохранить изменения
                    </Button>
                  </>
                )}
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
export default ProfilePage;
