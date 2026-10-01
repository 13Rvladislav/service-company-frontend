import { useEffect, useMemo, useState } from "react";
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

export default function ZonesPage() {
    const [user, setUser] = useState(null);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState({});

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
    });
    const [editingZone, setEditingZone] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedZone, setSelectedZone] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [profile, zoneList] = await Promise.all([
                getCurrentProfile(),
                getAllZones(),
            ]);

            setUser(profile);
            setZones(Array.isArray(zoneList) ? zoneList : []);
        } catch (e) {
            console.error(e);
            setZones([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;

        try {
            if (editingZone) {
                await updateZone(editingZone.id, form);
            } else {
                await createZone(form);
            }

            setOpen(false);
            setEditingZone(null);
            setForm({ name: "", description: "" });

            loadData();
        } catch (e) {
            console.error(e);
            alert("Ошибка сохранения зоны");
        }
    };
    const handleEdit = (zone) => {
        setEditingZone(zone);

        setForm({
            name: zone.name,
            description: zone.description || "",
        });

        setOpen(true);
    };

    const handleDeleteClick = (zone) => {
        setSelectedZone(zone);
        setDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteZone(selectedZone.id);

            setDeleteDialog(false);
            setSelectedZone(null);

            loadData();
        } catch (e) {
            const message =
                e.response?.data?.message ||
                "Невозможно удалить зону";

            alert(message);
        }
    };

    const filteredZones = useMemo(() => {
        return zones.filter((z) =>
            `${z.name} ${z.description ?? ""}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [zones, search]);

    const total = zones.length;
    const used = zones.filter((z) => z.description?.trim()).length;
    const free = total - used;

    const toggle = (id) => {
        setExpanded((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <MainLayout user={user}>
            <Box sx={{ p: 1 }}>

                {/* Заголовок */}
                <Box mb={3}>
                    <Stack direction="row" spacing={0} alignItems="center">
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

                    <Typography color="text.secondary" mt={0.5} sx={{ mb: 2 }}>
                        Создание и управление территориями обслуживания
                    </Typography>
                </Box>

                {/* Карточки */}
                <Grid container spacing={3} mb={4} sx={{ mb: 5 }}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, height: 120 }}>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">
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
                                <Typography variant="body2" color="text.secondary">
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
                                <Typography variant="body2" color="text.secondary">
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

                {/* Поиск */}
                <Card sx={{ borderRadius: 3, mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Поиск зон
                        </Typography>

                        <TextField
                            fullWidth
                            placeholder="Название или описание зоны..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* Таблица */}
                <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
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
                                    onClick={() => setOpen(true)}
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

                        {loading ? (
                            <Box py={6} textAlign="center">
                                <CircularProgress />
                            </Box>
                        ) : (<Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell width={50}></TableCell>
                                    <TableCell width={60}>№</TableCell>
                                    <TableCell>Зона</TableCell>
                                    <TableCell>Описание</TableCell>
                                    <TableCell width={150}>Статус</TableCell>

                                    {user?.role === "ADMIN" && (
                                        <TableCell width={140} align="center">
                                            Действия
                                        </TableCell>
                                    )}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {filteredZones.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={user?.role === "ADMIN" ? 6 : 5}
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
                                    filteredZones.map((zone, index) => (
                                        <>
                                            <TableRow hover key={zone.id}>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => toggle(zone.id)}
                                                    >
                                                        {expanded[zone.id] ? (
                                                            <KeyboardArrowDownIcon />
                                                        ) : (
                                                            <KeyboardArrowRightIcon />
                                                        )}
                                                    </IconButton>
                                                </TableCell>

                                                <TableCell>{index + 1}</TableCell>

                                                <TableCell>
                                                    <Typography fontWeight={700}>
                                                        {zone.name}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    {zone.description || "Без описания"}
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={
                                                            zone.description
                                                                ? "Используется"
                                                                : "Свободна"
                                                        }
                                                        color={
                                                            zone.description
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
                                                                onClick={() => handleEdit(zone)}
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
                                                                onClick={() => handleDeleteClick(zone)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    </TableCell>
                                                )}
                                            </TableRow>

                                            <TableRow>
                                                <TableCell
                                                    colSpan={user?.role === "ADMIN" ? 6 : 5}
                                                    sx={{ p: 0, border: 0 }}
                                                >
                                                    <Collapse in={expanded[zone.id]}>
                                                        <Box
                                                            sx={{
                                                                bgcolor: "#F8FAFC",
                                                                px: 8,
                                                                py: 2,
                                                                borderTop:
                                                                    "1px solid #E5E7EB",
                                                            }}
                                                        >
                                                            <Typography
                                                                fontWeight={600}
                                                                color="text.secondary"
                                                                mb={1}
                                                            >
                                                                Адреса зоны
                                                            </Typography>

                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                            >
                                                                Здесь в будущем будет
                                                                раскрывающееся дерево
                                                                адресов этой зоны.
                                                            </Typography>
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ))
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
                {/* Модалка создания */}
                <Dialog
                    open={open}
                    onClose={() => setOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Создание новой зоны</DialogTitle>

                    <DialogContent>
                        <Stack spacing={2} mt={1}>
                            <TextField
                                label="Название зоны"
                                fullWidth
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />

                            <TextField
                                label="Описание"
                                multiline
                                rows={4}
                                fullWidth
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpen(false)}>
                            Отмена
                        </Button>

                        <Button variant="contained" onClick={handleSave}>
                            {editingZone ? "Сохранить" : "Создать"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </MainLayout>
    );
}