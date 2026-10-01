import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
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
  const [user, setUser] = useState(null);

  // режим редактирования
  const [editMode, setEditMode] = useState(false);
  const [originalUser, setOriginalUser] = useState(null);

  // каскад адреса
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
    try {
      const profile = await getCurrentProfile();

      setUser(profile);
      setOriginalUser(profile);

      const cityList = await getAllCities();
      setCities(cityList);

      // восстановление адреса пользователя
      if (profile.cityId) {
        setSelectedCityId(profile.cityId);

        const streetList = await getStreetsByCity(profile.cityId);
        setStreets(streetList);

        if (profile.streetId) {
          setSelectedStreetId(profile.streetId);

          const houseList = await getHousesByStreet(profile.streetId);
          setHouses(houseList);

          if (profile.houseId) {
            setSelectedHouseId(profile.houseId);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const changeField = (field, value) => {
    setUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ---------- каскад адреса ----------

  const handleCityChange = async (cityId) => {
    setSelectedCityId(cityId);
    setSelectedStreetId("");
    setSelectedHouseId("");

    setUser((prev) => ({
      ...prev,
      cityId,
      streetId: null,
      houseId: null,
    }));

    const streetList = await getStreetsByCity(cityId);
    setStreets(streetList);
    setHouses([]);
  };

  const handleStreetChange = async (streetId) => {
    setSelectedStreetId(streetId);
    setSelectedHouseId("");

    setUser((prev) => ({
      ...prev,
      streetId,
      houseId: null,
    }));

    const houseList = await getHousesByStreet(streetId);
    setHouses(houseList);
  };

  const handleHouseChange = (houseId) => {
    setSelectedHouseId(houseId);

    setUser((prev) => ({
      ...prev,
      houseId,
    }));
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUser((prev) => ({
      ...prev,
      avatarPreview: URL.createObjectURL(file),
    }));

    try {
      await uploadAvatar(file);

      setUser((prev) => ({
        ...prev,
        hasAvatar: true,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      const updated = await updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        phone: user.phone,

        houseId: selectedHouseId,
        apartment: user.apartment,
      });

      const merged = {
        ...user,
        ...updated,
      };

      setUser(merged);
      setOriginalUser(merged);
      setEditMode(false);

      setUser(updated);
      setOriginalUser(updated);
      setEditMode(false);

      alert("Профиль успешно сохранён");
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения");
    }
  };

  const handleCancel = async () => {
    setUser(originalUser);

    setSelectedCityId(originalUser.cityId || "");
    setSelectedStreetId(originalUser.streetId || "");
    setSelectedHouseId(originalUser.houseId || "");

    if (originalUser.cityId) {
      const streetList = await getStreetsByCity(originalUser.cityId);
      setStreets(streetList);

      if (originalUser.streetId) {
        const houseList = await getHousesByStreet(originalUser.streetId);
        setHouses(houseList);
      } else {
        setHouses([]);
      }
    }

    setEditMode(false);
  };

  if (loading || !user) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MainLayout user={user}>
      <Box sx={{ width: "100%" }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Профиль
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Управление личными данными пользователя
        </Typography>

        <Grid container spacing={3}>
          {/* ===== ЛЕВАЯ КАРТОЧКА ===== */}

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

                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 5,
                      bgcolor: "#DBEAFE",
                    }}
                  >
                    <Typography
                      fontWeight={700}
                      fontSize={13}
                      color="#1D4ED8"
                      textTransform="uppercase"
                    >
                      {user.role}
                    </Typography>
                  </Box>

                  <Divider sx={{ width: "100%" }} />

                  <Box sx={{ width: "100%" }}>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Фамилия
                        </Typography>
                        <Typography fontWeight={600}>
                          {user.lastName}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Имя
                        </Typography>
                        <Typography fontWeight={600}>
                          {user.firstName}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Отчество
                        </Typography>
                        <Typography fontWeight={600}>
                          {user.middleName}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Тип профиля
                        </Typography>

                        <Typography fontWeight={700} color="primary">
                          {user.role}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PhotoCameraIcon />}
                    onClick={() => fileInput.current.click()}
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

          {/* ===== ПРАВАЯ ЧАСТЬ ===== */}

          <Grid size={{ xs: 12, md: 9 }}>
            <Stack spacing={3}>
              {/* ================= ПЕРСОНАЛЬНЫЕ ДАННЫЕ ================= */}

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
                        onChange={(e) =>
                          changeField("lastName", e.target.value)
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Имя"
                        disabled={!editMode}
                        value={user.firstName || ""}
                        onChange={(e) =>
                          changeField("firstName", e.target.value)
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Отчество"
                        disabled={!editMode}
                        value={user.middleName || ""}
                        onChange={(e) =>
                          changeField("middleName", e.target.value)
                        }
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Телефон"
                        disabled={!editMode}
                        value={user.phone || ""}
                        onChange={(e) =>
                          changeField("phone", e.target.value)
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

              {/* ================= CLIENT ================= */}

              {user.role === "CLIENT" && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700}>
                      Адрес проживания
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      {/* ГОРОД */}

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Город</InputLabel>

                          <Select
                            value={selectedCityId}
                            label="Город"
                            disabled={!editMode}
                            onChange={(e) =>
                              handleCityChange(e.target.value)
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

                      {/* УЛИЦА */}

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Улица</InputLabel>

                          <Select
                            value={selectedStreetId}
                            label="Улица"
                            disabled={!editMode || !selectedCityId}
                            onChange={(e) =>
                              handleStreetChange(e.target.value)
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

                      {/* ДОМ */}

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Дом</InputLabel>

                          <Select
                            value={selectedHouseId}
                            label="Дом"
                            disabled={!editMode || !selectedStreetId}
                            onChange={(e) =>
                              handleHouseChange(e.target.value)
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

                      {/* КВАРТИРА */}

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Квартира"
                          disabled={!editMode}
                          value={user.apartment || ""}
                          onChange={(e) =>
                            changeField("apartment", e.target.value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* ================= MASTER ================= */}

              {user.role === "ENGINEER" && (
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
                          label="Специализация"
                          value={user.specialization || ""}
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

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          disabled
                          label="Зона обслуживания"
                          value={user.zoneName || ""}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
              {/* ================= DISPATCHER ================= */}

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

              {/* ================= ADMIN ================= */}

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
                          value={user.role}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* ================= КНОПКИ ================= */}

              <Box display="flex" justifyContent="flex-end" gap={3}>
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
                      sx={{ mr: 2 }}
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