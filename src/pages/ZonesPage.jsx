
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";
import {
    getAllZones,
    createZone,
    updateZone,
    deleteZone,
} from "../api/zoneApi";
import {
    getAllCities,
    getStreetsByCity,
    getHousesByStreet,
} from "../api/addressApi";

export default function ZonesPage() {
    const [user, setUser] = useState(null);
    const [zones, setZones] = useState([]);
    const [zoneAddresses, setZoneAddresses] = useState({});
    const [loading, setLoading] = useState(true);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState({});

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", description: "" });
    const [editingZone, setEditingZone] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedZone, setSelectedZone] = useState(null);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setLoadError("");

        try {
            const [profile, zoneList, cities] = await Promise.all([
                getCurrentProfile(),
                getAllZones(),
                getAllCities(),
            ]);

            const safeZones = Array.isArray(zoneList) ? zoneList : [];
            const safeCities = Array.isArray(cities) ? cities : [];

            setUser(profile);
            setZones(safeZones);

            // Загружаем улицы сразу, не дожидаясь раскрытия зоны.
            setAddressesLoading(true);

            const cityResults = await Promise.all(
                safeCities.map(async (city) => {
                    const streets = await getStreetsByCity(city.id);

                    return (Array.isArray(streets) ? streets : []).map(
                        (street) => ({
                            ...street,
                            cityId: street.cityId ?? city.id,
                            cityName: street.cityName ?? city.name,
                        })
                    );
                })
            );

            const allStreets = cityResults.flat();
            const addresses = {};

            for (const zone of safeZones) {
                addresses[zone.id] = allStreets
                    .filter(
                        (street) =>
                            String(street.zoneId) === String(zone.id)
                    )
                    .map((street) => ({
                        ...street,
                        houses: [],
                        housesLoaded: false,
                        housesLoading: false,
                        housesError: "",
                    }));
            }

            setZoneAddresses(addresses);
        } catch (error) {
            console.error("Ошибка загрузки зон и адресов:", error);
            setLoadError(
                "Не удалось загрузить адреса. Проверь доступность сервера."
            );
        } finally {
            setAddressesLoading(false);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async () => {
        if (!form.name.trim() || saving) return;

        setSaving(true);

        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
            };

            if (editingZone) {
                await updateZone(editingZone.id, payload);
            } else {
                await createZone(payload);
            }

            setOpen(false);
            setEditingZone(null);
            setForm({ name: "", description: "" });

            await loadData();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                "Ошибка сохранения зоны"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCreate = () => {
        setEditingZone(null);
        setForm({ name: "", description: "" });
        setOpen(true);
    };

    const handleEdit = (zone) => {
        setEditingZone(zone);
        setForm({
            name: zone.name ?? "",
            description: zone.description ?? "",
        });
        setOpen(true);
    };

    const handleDeleteClick = (zone) => {
        setSelectedZone(zone);
        setDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!selectedZone) return;

        try {
            await deleteZone(selectedZone.id);
            setDeleteDialog(false);
            setSelectedZone(null);
            await loadData();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Невозможно удалить зону"
            );
        }
    };

    const loadHousesForZone = async (zoneId) => {
        const streets = zoneAddresses[zoneId] ?? [];

        const unloaded = streets.filter(
            (street) =>
                !street.housesLoaded && !street.housesLoading
        );

        if (unloaded.length === 0) return;

        setZoneAddresses((previous) => ({
            ...previous,
            [zoneId]: (previous[zoneId] ?? []).map((street) =>
                unloaded.some((item) => item.id === street.id)
                    ? { ...street, housesLoading: true, housesError: "" }
                    : street
            ),
        }));

        const results = await Promise.all(
            unloaded.map(async (street) => {
                try {
                    const houses = await getHousesByStreet(street.id);

                    return {
                        streetId: street.id,
                        houses: Array.isArray(houses) ? houses : [],
                        error: "",
                    };
                } catch (error) {
                    console.error(
                        `Ошибка загрузки домов улицы ${street.name}:`,
                        error
                    );

                    return {
                        streetId: street.id,
                        houses: [],
                        error: "Не удалось загрузить дома",
                    };
                }
            })
        );

        const resultByStreet = new Map(
            results.map((result) => [result.streetId, result])
        );

        setZoneAddresses((previous) => ({
            ...previous,
            [zoneId]: (previous[zoneId] ?? []).map((street) => {
                const result = resultByStreet.get(street.id);

                if (!result) return street;

                return {
                    ...street,
                    houses: result.houses,
                    housesLoaded: !result.error,
                    housesLoading: false,
                    housesError: result.error,
                };
            }),
        }));
    };

    const toggle = async (zoneId) => {
        const willExpand = !expanded[zoneId];

        setExpanded((previous) => ({
            ...previous,
            [zoneId]: willExpand,
        }));

        if (willExpand) {
            await loadHousesForZone(zoneId);
        }
    };

    const filteredZones = useMemo(
        () =>
            zones.filter((zone) =>
                `${zone.name ?? ""} ${zone.description ?? ""}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
            ),
        [zones, search]
    );

    // Статус зависит от привязанных улиц, а не от описания зоны
    // и не от того, раскрывал ли пользователь строку.
    const total = zones.length;
    const used = zones.filter(
        (zone) => (zoneAddresses[zone.id] ?? []).length > 0
    ).length;
    const free = total - used;

    return (
        <MainLayout user={user}>
            <Box sx={{ p: 1 }}>
                <Box mb={3}>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                    >
                        <LocationOnIcon color="primary" />
                        <Typography variant="h4" fontWeight={700}>
                            Зоны обслуживания
                        </Typography>

                        {user?.role === "ADMIN" && (
                            <Chip
                                label="Администратор"
                                color="primary"
                                size="small"
                            />
                        )}
                    </Stack>

                    <Typography
                        color="text.secondary"
                        mt={0.5}
                        sx={{ mb: 2 }}
                    >
                        Создание и управление территориями обслуживания
                    </Typography>
                </Box>

                <Grid container spacing={3} sx={{ mb: 5 }}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, height: 120 }}>
                            <CardContent>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Всего зон
                                </Typography>
                                <Typography
                                    variant="h3"
                                    fontWeight={700}
                                    color="primary"
                                    mt={1}
                                >
                                    {total}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, height: 120 }}>
                            <CardContent>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Использовано
                                </Typography>
                                <Typography
                                    variant="h3"
                                    fontWeight={700}
                                    mt={1}
                                    sx={{ color: "#16A34A" }}
                                >
                                    {used}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, height: 120 }}>
                            <CardContent>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Не использовано
                                </Typography>
                                <Typography
                                    variant="h3"
                                    fontWeight={700}
                                    mt={1}
                                    sx={{ color: "#EA580C" }}
                                >
                                    {free}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Card sx={{ borderRadius: 3, mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Поиск зон
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="Название или описание зоны..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </CardContent>
                </Card>

                <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 2,
                                mb: 2,
                            }}
                        >
                            <Typography variant="h6" fontWeight={700}>
                                Список зон
                            </Typography>

                            {user?.role === "ADMIN" && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={handleCreate}
                                    sx={{
                                        borderRadius: 2,
                                        minWidth: 150,
                                        height: 36,
                                        px: 2,
                                        textTransform: "none",
                                        fontWeight: 600,
                                    }}
                                >
                                    Создать зону
                                </Button>
                            )}
                        </Box>

                        {loadError && (
                            <Typography color="error" sx={{ mb: 2 }}>
                                {loadError}
                            </Typography>
                        )}

                        {loading ? (
                            <Box py={6} textAlign="center">
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={50} />
                                        <TableCell width={60}>№</TableCell>
                                        <TableCell>Зона</TableCell>
                                        <TableCell>Описание</TableCell>
                                        <TableCell width={150}>Статус</TableCell>
                                        {user?.role === "ADMIN" && (
                                            <TableCell
                                                width={140}
                                                align="center"
                                            >
                                                Действия
                                            </TableCell>
                                        )}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filteredZones.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={
                                                    user?.role === "ADMIN"
                                                        ? 6
                                                        : 5
                                                }
                                                align="center"
                                            >
                                                <Box py={4}>
                                                    <Typography color="text.secondary">
                                                        Зоны отсутствуют
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredZones.map((zone, index) => {
                                            const streets =
                                                zoneAddresses[zone.id] ?? [];
                                            const isUsed = streets.length > 0;

                                            return (
                                                <Fragment key={zone.id}>
                                                    <TableRow hover>
                                                        <TableCell>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    toggle(zone.id)
                                                                }
                                                                disabled={
                                                                    addressesLoading &&
                                                                    !Object.prototype.hasOwnProperty.call(
                                                                        zoneAddresses,
                                                                        zone.id
                                                                    )
                                                                }
                                                            >
                                                                {expanded[zone.id] ? (
                                                                    <KeyboardArrowDownIcon />
                                                                ) : (
                                                                    <KeyboardArrowRightIcon />
                                                                )}
                                                            </IconButton>
                                                        </TableCell>

                                                        <TableCell>
                                                            {index + 1}
                                                        </TableCell>

                                                        <TableCell>
                                                            <Typography fontWeight={700}>
                                                                {zone.name}
                                                            </Typography>
                                                        </TableCell>

                                                        <TableCell>
                                                            {zone.description ||
                                                                "Без описания"}
                                                        </TableCell>

                                                        <TableCell>
                                                            <Chip
                                                                label={
                                                                    addressesLoading &&
                                                                    !Object.prototype.hasOwnProperty.call(
                                                                        zoneAddresses,
                                                                        zone.id
                                                                    )
                                                                        ? "Загрузка..."
                                                                        : isUsed
                                                                          ? "Используется"
                                                                          : "Свободна"
                                                                }
                                                                color={
                                                                    isUsed
                                                                        ? "success"
                                                                        : "warning"
                                                                }
                                                                size="small"
                                                            />
                                                        </TableCell>

                                                        {user?.role === "ADMIN" && (
                                                            <TableCell align="center">
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                    justifyContent="center"
                                                                >
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        sx={{
                                                                            bgcolor: "#EEF4FF",
                                                                            "&:hover": {
                                                                                bgcolor: "#DCE8FF",
                                                                            },
                                                                        }}
                                                                        onClick={() =>
                                                                            handleEdit(zone)
                                                                        }
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>

                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        sx={{
                                                                            bgcolor: "#FEECEC",
                                                                            "&:hover": {
                                                                                bgcolor: "#FCD7D7",
                                                                            },
                                                                        }}
                                                                        onClick={() =>
                                                                            handleDeleteClick(zone)
                                                                        }
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Stack>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>

                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={
                                                                user?.role === "ADMIN"
                                                                    ? 6
                                                                    : 5
                                                            }
                                                            sx={{
                                                                p: 0,
                                                                border: 0,
                                                            }}
                                                        >
                                                            <Collapse
                                                                in={Boolean(
                                                                    expanded[zone.id]
                                                                )}
                                                                unmountOnExit={false}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        bgcolor: "#F8FAFC",
                                                                        px: { xs: 2, md: 8 },
                                                                        py: 2,
                                                                        borderTop:
                                                                            "1px solid #E5E7EB",
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        fontWeight={600}
                                                                        color="text.secondary"
                                                                        mb={2}
                                                                    >
                                                                        Адреса зоны
                                                                        «{zone.name}»
                                                                    </Typography>

                                                                    {addressesLoading &&
                                                                    !Object.prototype.hasOwnProperty.call(
                                                                        zoneAddresses,
                                                                        zone.id
                                                                    ) ? (
                                                                        <CircularProgress size={22} />
                                                                    ) : streets.length === 0 ? (
                                                                        <Typography
                                                                            variant="body2"
                                                                            color="text.secondary"
                                                                        >
                                                                            К этой зоне пока не привязаны улицы.
                                                                        </Typography>
                                                                    ) : (
                                                                        <Stack spacing={1.5}>
                                                                            {streets.map(
                                                                                (street) => (
                                                                                    <Box
                                                                                        key={street.id}
                                                                                        sx={{
                                                                                            p: 1.5,
                                                                                            bgcolor: "#FFFFFF",
                                                                                            border: "1px solid #E5E7EB",
                                                                                            borderRadius: 2,
                                                                                        }}
                                                                                    >
                                                                                        <Typography fontWeight={600}>
                                                                                            {street.cityName ||
                                                                                                "Город не указан"}{" "}
                                                                                            — {street.name}
                                                                                        </Typography>

                                                                                        <Stack
                                                                                            direction="row"
                                                                                            spacing={1}
                                                                                            useFlexGap
                                                                                            flexWrap="wrap"
                                                                                            mt={1}
                                                                                        >
                                                                                            {street.housesLoading ? (
                                                                                                <CircularProgress size={18} />
                                                                                            ) : street.housesError ? (
                                                                                                <Typography
                                                                                                    variant="body2"
                                                                                                    color="error"
                                                                                                >
                                                                                                    {street.housesError}
                                                                                                </Typography>
                                                                                            ) : !street.housesLoaded ? (
                                                                                                <Typography
                                                                                                    variant="body2"
                                                                                                    color="text.secondary"
                                                                                                >
                                                                                                    Дома ещё не загружены
                                                                                                </Typography>
                                                                                            ) : street.houses.length === 0 ? (
                                                                                                <Typography
                                                                                                    variant="body2"
                                                                                                    color="text.secondary"
                                                                                                >
                                                                                                    Дома не добавлены
                                                                                                </Typography>
                                                                                            ) : (
                                                                                                street.houses.map(
                                                                                                    (house) => (
                                                                                                        <Chip
                                                                                                            key={house.id}
                                                                                                            size="small"
                                                                                                            variant="outlined"
                                                                                                            label={`Дом ${house.number}`}
                                                                                                        />
                                                                                                    )
                                                                                                )
                                                                                            )}
                                                                                        </Stack>
                                                                                    </Box>
                                                                                )
                                                                            )}
                                                                        </Stack>
                                                                    )}
                                                                </Box>
                                                            </Collapse>
                                                        </TableCell>
                                                    </TableRow>
                                                </Fragment>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Dialog
                    open={deleteDialog}
                    onClose={() => setDeleteDialog(false)}
                >
                    <DialogTitle>Удаление зоны</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Точно хотите удалить зону{" "}
                            <b>{selectedZone?.name}</b>?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialog(false)}>
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

                <Dialog
                    open={open}
                    onClose={() => setOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {editingZone ? "Редактирование зоны" : "Создание новой зоны"}
                    </DialogTitle>

                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            <TextField
                                label="Название зоны"
                                fullWidth
                                value={form.name}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        name: event.target.value,
                                    })
                                }
                            />

                            <TextField
                                label="Описание"
                                multiline
                                rows={4}
                                fullWidth
                                value={form.description}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        description: event.target.value,
                                    })
                                }
                            />
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpen(false)}>
                            Отмена
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? "Сохранение..."
                                : editingZone
                                  ? "Сохранить"
                                  : "Создать"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
}
