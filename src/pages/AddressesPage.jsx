import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import SignpostIcon from "@mui/icons-material/Signpost";
import HomeWorkIcon from "@mui/icons-material/HomeWork";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";

import {
  getAllCities,
  createCity,
  updateCity,
  deleteCity,
  getStreetsByCity,
  createStreet,
  updateStreet,
  deleteStreet,
  getHousesByStreet,
  createHouse,
  updateHouse,
  deleteHouse,
} from "../api/addressApi";

import { getAllZones } from "../api/zoneApi";

export default function AddressesPage() {
  const [user, setUser] = useState(null);

  const [cities, setCities] = useState([]);
  const [streets, setStreets] = useState([]);
  const [houses, setHouses] = useState([]);
  const [zones, setZones] = useState([]);

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedStreet, setSelectedStreet] = useState(null);

  const [openCity, setOpenCity] = useState(false);
  const [openStreet, setOpenStreet] = useState(false);
  const [openHouse, setOpenHouse] = useState(false);

  const [cityName, setCityName] = useState("");

  const [streetForm, setStreetForm] = useState({
    name: "",
    zoneId: "",
  });

  const [houseNumber, setHouseNumber] = useState("");

  // ===== EDIT =====

  const [editCity, setEditCity] = useState(null);
  const [editStreet, setEditStreet] = useState(null);
  const [editHouse, setEditHouse] = useState(null);

  const [editCityName, setEditCityName] = useState("");
  const [editStreetName, setEditStreetName] = useState("");
  const [editStreetZone, setEditStreetZone] = useState("");
  const [editHouseNumber, setEditHouseNumber] = useState("");

  const [openEditCity, setOpenEditCity] = useState(false);
  const [openEditStreet, setOpenEditStreet] = useState(false);
  const [openEditHouse, setOpenEditHouse] = useState(false);

  // ===== DELETE =====

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);

  // ===== SNACKBAR =====

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const profile = await getCurrentProfile();
      setUser(profile);

      await loadInitial();
    } catch (e) {
      console.error(e);
    }
  };

  const loadInitial = async () => {
    const [citiesData, zonesData] = await Promise.all([
      getAllCities(),
      getAllZones(),
    ]);

    setCities(citiesData);
    setZones(zonesData);

    if (citiesData.length) {
      await selectCity(citiesData[0]);
    }
  };

  const selectCity = async (city) => {
    setSelectedCity(city);
    setSelectedStreet(null);

    const data = await getStreetsByCity(city.id);
    setStreets(data);
    setHouses([]);

    if (data.length) {
      await selectStreet(data[0]);
    }
  };

  const selectStreet = async (street) => {
    setSelectedStreet(street);

    const data = await getHousesByStreet(street.id);
    setHouses(data);
  };

  // ================= CREATE =================

  const handleCreateCity = async () => {
    if (!cityName.trim()) return;

    await createCity(cityName);

    setCityName("");
    setOpenCity(false);

    await loadInitial();
  };

  const handleCreateStreet = async () => {
    await createStreet({
      name: streetForm.name,
      cityId: selectedCity.id,
      zoneId: streetForm.zoneId,
    });

    setStreetForm({
      name: "",
      zoneId: "",
    });

    setOpenStreet(false);

    await selectCity(selectedCity);
  };

  const handleCreateHouse = async () => {
    await createHouse({
      number: houseNumber,
      streetId: selectedStreet.id,
    });

    setHouseNumber("");
    setOpenHouse(false);

    await selectStreet(selectedStreet);
  };

  // ================= UPDATE =================

  const handleUpdateCity = async () => {
    await updateCity(editCity.id, editCityName);

    setOpenEditCity(false);

    await loadInitial();
  };

  const handleUpdateStreet = async () => {
    await updateStreet(editStreet.id, {
      name: editStreetName,
      zoneId: editStreetZone,
    });

    setOpenEditStreet(false);

    await selectCity(selectedCity);
  };

  const handleUpdateHouse = async () => {
    await updateHouse(editHouse.id, editHouseNumber);

    setOpenEditHouse(false);

    await selectStreet(selectedStreet);
  };

  // ================= DELETE =================

  const confirmDelete = async () => {
    try {
      if (deleteType === "city") {
        await deleteCity(deleteTarget.id);
        await loadInitial();
      }

      if (deleteType === "street") {
        await deleteStreet(deleteTarget.id);
        await selectCity(selectedCity);
      }

      if (deleteType === "house") {
        await deleteHouse(deleteTarget.id);
        await selectStreet(selectedStreet);
      }

      setSnackbar({
        open: true,
        message: "Успешно удалено",
        severity: "success",
      });
    } catch (e) {
      setSnackbar({
        open: true,
        message:
          e.response?.data?.message || "Удаление невозможно",
        severity: "error",
      });
    } finally {
      setOpenDelete(false);
    }
  };

  return (
    <MainLayout user={user}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Адресный справочник
        </Typography>

        <Typography color="text.secondary" mb={4}>
          Управление городами, улицами и домами
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 3,
          }}
        >
          {/* ================= ГОРОДА ================= */}

          <Paper
            elevation={0}
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: 3,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: 650,
            }}
          >
            <Box sx={{ bgcolor: "#2563EB", color: "#fff", p: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationCityIcon />
                <Typography fontWeight={700}>Города</Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
              <List disablePadding>
                {cities.map((city) => (
                  <ListItemButton
                    key={city.id}
                    selected={selectedCity?.id === city.id}
                    onClick={() => selectCity(city)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <ListItemText primary={city.name} />

                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditCity(city);
                          setEditCityName(city.name);
                          setOpenEditCity(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(city);
                          setDeleteType("city");
                          setOpenDelete(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemButton>
                ))}
              </List>
            </Box>

            <Divider />

            <Box p={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCity(true)}
              >
                Добавить город
              </Button>
            </Box>
          </Paper>
          {/* ================= УЛИЦЫ ================= */}

          <Paper
            elevation={0}
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: 3,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: 650,
            }}
          >
            <Box sx={{ bgcolor: "#0EA5E9", color: "#fff", p: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <SignpostIcon />
                <Typography fontWeight={700}>Улицы</Typography>
              </Box>

              <Typography variant="caption">
                {selectedCity?.name || "Выберите город"}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
              <List disablePadding>
                {streets.map((street) => (
                  <ListItemButton
                    key={street.id}
                    selected={selectedStreet?.id === street.id}
                    onClick={() => selectStreet(street)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography fontWeight={600}>
                        {street.name}
                      </Typography>

                      {street.zoneName ? (
                        <Chip
                          label={street.zoneName}
                          color="primary"
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Зона не назначена
                        </Typography>
                      )}
                    </Box>

                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditStreet(street);
                          setEditStreetName(street.name);
                          setEditStreetZone(street.zoneId || "");
                          setOpenEditStreet(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(street);
                          setDeleteType("street");
                          setOpenDelete(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemButton>
                ))}
              </List>
            </Box>

            <Divider />

            <Box p={2}>
              <Button
                fullWidth
                variant="contained"
                color="info"
                startIcon={<AddIcon />}
                disabled={!selectedCity}
                onClick={() => setOpenStreet(true)}
              >
                Добавить улицу
              </Button>
            </Box>
          </Paper>

          {/* ================= ДОМА ================= */}

          <Paper
            elevation={0}
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: 3,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: 650,
            }}
          >
            <Box sx={{ bgcolor: "#64748B", color: "#fff", p: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <HomeWorkIcon />
                <Typography fontWeight={700}>Дома</Typography>
              </Box>

              <Typography variant="caption">
                {selectedStreet?.name || "Выберите улицу"}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
              <List disablePadding>
                {houses.map((house) => (
                  <ListItemButton
                    key={house.id}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography fontWeight={600}>
                      Дом {house.houseNumber || house.number}
                    </Typography>

                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditHouse(house);
                          setEditHouseNumber(
                            house.houseNumber || house.number
                          );
                          setOpenEditHouse(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(house);
                          setDeleteType("house");
                          setOpenDelete(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemButton>
                ))}
              </List>
            </Box>

            <Divider />

            <Box p={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!selectedStreet}
                onClick={() => setOpenHouse(true)}
                sx={{
                  bgcolor: "#64748B",
                  "&:hover": {
                    bgcolor: "#475569",
                  },
                }}
              >
                Добавить дом
              </Button>
            </Box>
          </Paper>
        </Box>
        {/* ========= СОЗДАНИЕ ГОРОДА ========= */}

        <Dialog
          open={openCity}
          onClose={() => setOpenCity(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Добавить город</DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              label="Название города"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenCity(false)}>
              Отмена
            </Button>

            <Button variant="contained" onClick={handleCreateCity}>
              Создать
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========= РЕДАКТИРОВАНИЕ ГОРОДА ========= */}

        <Dialog
          open={openEditCity}
          onClose={() => setOpenEditCity(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Редактировать город</DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              label="Название города"
              value={editCityName}
              onChange={(e) => setEditCityName(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenEditCity(false)}>
              Отмена
            </Button>

            <Button variant="contained" onClick={handleUpdateCity}>
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========= СОЗДАНИЕ УЛИЦЫ ========= */}

        <Dialog
          open={openStreet}
          onClose={() => setOpenStreet(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Добавить улицу</DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              disabled
              label="Город"
              value={selectedCity?.name || ""}
              sx={{ mt: 1, mb: 2 }}
            />

            <TextField
              fullWidth
              label="Название улицы"
              value={streetForm.name}
              onChange={(e) =>
                setStreetForm({
                  ...streetForm,
                  name: e.target.value,
                })
              }
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth>
              <InputLabel>Зона обслуживания</InputLabel>

              <Select
                value={streetForm.zoneId}
                label="Зона обслуживания"
                onChange={(e) =>
                  setStreetForm({
                    ...streetForm,
                    zoneId: e.target.value,
                  })
                }
              >
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenStreet(false)}>
              Отмена
            </Button>

            <Button variant="contained" onClick={handleCreateStreet}>
              Создать
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========= РЕДАКТИРОВАНИЕ УЛИЦЫ ========= */}

        <Dialog
          open={openEditStreet}
          onClose={() => setOpenEditStreet(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Редактировать улицу</DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              label="Название улицы"
              value={editStreetName}
              onChange={(e) => setEditStreetName(e.target.value)}
              sx={{ mt: 1, mb: 2 }}
            />

            <FormControl fullWidth>
              <InputLabel>Зона обслуживания</InputLabel>

              <Select
                value={editStreetZone}
                label="Зона обслуживания"
                onChange={(e) => setEditStreetZone(e.target.value)}
              >
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenEditStreet(false)}>
              Отмена
            </Button>

            <Button variant="contained" onClick={handleUpdateStreet}>
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========= СОЗДАНИЕ ДОМА ========= */}

        <Dialog
          open={openHouse}
          onClose={() => setOpenHouse(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Добавить дом</DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              disabled
              label="Улица"
              value={selectedStreet?.name || ""}
              sx={{ mt: 1, mb: 2 }}
            />

            <TextField
              fullWidth
              label="Номер дома"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenHouse(false)}>
              Отмена
            </Button>

            <Button variant="contained" onClick={handleCreateHouse}>
              Создать
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========= РЕДАКТИРОВАНИЕ ДОМА ========= */}

        <Dialog
          open={openEditHouse}
          onClose={() => setOpenEditHouse(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Редактировать дом</DialogTitle>

          <DialogContent>
            <TextField
              fullWidth
              label="Номер дома"
              value={editHouseNumber}
              onChange={(e) => setEditHouseNumber(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenEditHouse(false)}>
              Отмена
            </Button>

            <Button variant="contained" onClick={handleUpdateHouse}>
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========= ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ ========= */}

        <Dialog
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Подтверждение удаления</DialogTitle>

          <DialogContent>
            <Typography>
              Вы действительно хотите удалить{" "}
              <b>
                {deleteType === "city" && "город"}
                {deleteType === "street" && "улицу"}
                {deleteType === "house" && "дом"}
              </b>{" "}
              «
              {deleteTarget?.name ||
                deleteTarget?.houseNumber ||
                deleteTarget?.number}
              »?
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              mt={1}
            >
              Это действие нельзя отменить.
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>
              Отмена
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={confirmDelete}
            >
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========= SNACKBAR ========= */}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() =>
            setSnackbar({
              ...snackbar,
              open: false,
            })
          }
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}