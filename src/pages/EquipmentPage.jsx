import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import BuildIcon from "@mui/icons-material/Build";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

import MainLayout from "../components/layout/MainLayout";

import {
  getEquipmentTypes,
  getEquipmentCatalog,
  createEquipmentCatalogItem,
  updateEquipmentCatalogItem,
  deleteEquipmentCatalogItem,
} from "../api/equipmentApi";

import { getCurrentProfile } from "../api/userApi";

export default function EquipmentPage() {
  /* ========================================================= */
  /* USER                                                        */
  /* ========================================================= */

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ========================================================= */
  /* DATA                                                        */
  /* ========================================================= */

  const [types, setTypes] = useState([]);
  const [equipment, setEquipment] =
    useState([]);

  const [dataLoading, setDataLoading] =
    useState(false);

  const [error, setError] = useState("");

  /* ========================================================= */
  /* SEARCH / FILTER                                             */
  /* ========================================================= */

  const [search, setSearch] = useState("");

  const [selectedType, setSelectedType] =
    useState("");

  /* ========================================================= */
  /* FORM                                                        */
  /* ========================================================= */

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [editingEquipment, setEditingEquipment] =
    useState(null);

  const [equipmentTypeId, setEquipmentTypeId] =
    useState("");

  const [manufacturer, setManufacturer] =
    useState("");

  const [model, setModel] = useState("");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] =
    useState("");

  /* ========================================================= */
  /* DELETE                                                      */
  /* ========================================================= */

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [equipmentToDelete, setEquipmentToDelete] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  /* ========================================================= */
  /* LOAD                                                        */
  /* ========================================================= */

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    try {
      setLoading(true);

      const profile =
        await getCurrentProfile();

      setUser(profile);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        "Не удалось загрузить каталог оборудования"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setDataLoading(true);
      setError("");

      const [
        typesData,
        equipmentData,
      ] = await Promise.all([
        getEquipmentTypes(),
        getEquipmentCatalog(),
      ]);

      setTypes(typesData || []);
      setEquipment(
        equipmentData || []
      );
    } catch (err) {
      console.error(err);

      setError(
        "Не удалось загрузить оборудование"
      );
    } finally {
      setDataLoading(false);
    }
  };

  /* ========================================================= */
  /* FILTER                                                      */
  /* ========================================================= */

  const filteredEquipment = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return equipment.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.manufacturer
          ?.toLowerCase()
          .includes(searchValue) ||
        item.model
          ?.toLowerCase()
          .includes(searchValue) ||
        item.equipmentTypeName
          ?.toLowerCase()
          .includes(searchValue) ||
        item.description
          ?.toLowerCase()
          .includes(searchValue);

      const matchesType =
        !selectedType ||
        String(item.equipmentTypeId) ===
          String(selectedType);

      return (
        matchesSearch &&
        matchesType
      );
    });
  }, [
    equipment,
    search,
    selectedType,
  ]);

  /* ========================================================= */
  /* ADD                                                         */
  /* ========================================================= */

  const handleAdd = () => {
    setEditingEquipment(null);

    setEquipmentTypeId("");
    setManufacturer("");
    setModel("");
    setDescription("");

    setFormError("");
    setDialogOpen(true);
  };

  /* ========================================================= */
  /* EDIT                                                        */
  /* ========================================================= */

  const handleEdit = (item) => {
    setEditingEquipment(item);

    setEquipmentTypeId(
      item.equipmentTypeId || ""
    );

    setManufacturer(
      item.manufacturer || ""
    );

    setModel(item.model || "");

    setDescription(
      item.description || ""
    );

    setFormError("");
    setDialogOpen(true);
  };

  /* ========================================================= */
  /* SAVE                                                        */
  /* ========================================================= */

  const handleSave = async () => {
    const trimmedManufacturer =
      manufacturer.trim();

    const trimmedModel =
      model.trim();

    if (!equipmentTypeId) {
      setFormError(
        "Выберите тип оборудования"
      );

      return;
    }

    if (!trimmedManufacturer) {
      setFormError(
        "Введите производителя"
      );

      return;
    }

    if (!trimmedModel) {
      setFormError(
        "Введите модель"
      );

      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload = {
        equipmentTypeId,
        manufacturer:
          trimmedManufacturer,
        model: trimmedModel,
        description:
          description.trim() || null,
      };

      let saved;

      if (editingEquipment) {
        saved =
          await updateEquipmentCatalogItem(
            editingEquipment.id,
            payload
          );

        setEquipment((prev) =>
          prev.map((item) =>
            item.id === saved.id
              ? saved
              : item
          )
        );
      } else {
        saved =
          await createEquipmentCatalogItem(
            payload
          );

        setEquipment((prev) => [
          ...prev,
          saved,
        ]);
      }

      setDialogOpen(false);
      setEditingEquipment(null);
    } catch (err) {
      console.error(err);

      setFormError(
        "Не удалось сохранить оборудование"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ========================================================= */
  /* DELETE                                                      */
  /* ========================================================= */

  const handleDeleteClick = (item) => {
    setEquipmentToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!equipmentToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await deleteEquipmentCatalogItem(
        equipmentToDelete.id
      );

      setEquipment((prev) =>
        prev.filter(
          (item) =>
            item.id !==
            equipmentToDelete.id
        )
      );

      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    } catch (err) {
      console.error(err);

      setError(
        "Не удалось удалить оборудование"
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ========================================================= */
  /* LOADING                                                     */
  /* ========================================================= */

  if (loading || !user) {
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
  /* PAGE                                                        */
  /* ========================================================= */

  return (
    <MainLayout user={user}>
      <Box
        sx={{
          width: "100%",
          maxWidth: 1300,
          mx: "auto",
        }}
      >
        {/* ===================================================== */}
        {/* HEADER                                                */}
        {/* ===================================================== */}

        <Box sx={{ mb: 4 }}>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            justifyContent="space-between"
            spacing={2}
          >
            {/* Заголовок */}

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "#E8F0FE",
                  color: "#2563EB",
                }}
              >
                <BuildIcon
                  sx={{
                    fontSize: 28,
                  }}
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
                  Оборудование
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Каталог моделей оборудования
                </Typography>
              </Box>
            </Stack>

            {/* Кнопка */}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{
                height: 40,
                px: 1.8,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
                color: "#2563EB",
                borderColor: "#BFDBFE",
                backgroundColor: "#FFFFFF",
                whiteSpace: "nowrap",
                boxShadow: "none",

                "& .MuiButton-startIcon": {
                  marginRight: 0.7,
                },

                "&:hover": {
                  borderColor: "#93C5FD",
                  backgroundColor: "#EFF6FF",
                  boxShadow: "none",
                },
              }}
            >
              Добавить оборудование
            </Button>
          </Stack>
        </Box>

        {/* ===================================================== */}
        {/* ERROR                                                 */}
        {/* ===================================================== */}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {/* ===================================================== */}
        {/* FILTERS                                               */}
        {/* ===================================================== */}

        <Card
          sx={{
            borderRadius: 3,
            border: "1px solid #E5E7EB",
            boxShadow:
              "0 2px 8px rgba(15,23,42,.04)",
            mb: 3,
          }}
        >
          <CardContent
            sx={{
              p: 2,
              "&:last-child": {
                pb: 2,
              },
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={2}
            >
              <TextField
                fullWidth
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Поиск по производителю, модели..."
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{
                          color:
                            "#94A3B8",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius: 2,
                    },
                }}
              />

              <FormControl
                size="small"
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 260,
                  },
                }}
              >
                <InputLabel>
                  Тип оборудования
                </InputLabel>

                <Select
                  value={selectedType}
                  label="Тип оборудования"
                  onChange={(e) =>
                    setSelectedType(
                      e.target.value
                    )
                  }
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">
                    Все типы
                  </MenuItem>

                  {types.map((type) => (
                    <MenuItem
                      key={type.id}
                      value={type.id}
                    >
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {/* ===================================================== */}
        {/* STATISTICS                                            */}
        {/* ===================================================== */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Всего */}

          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid #E5E7EB",
              boxShadow: "none",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: "#EFF6FF",
                    color: "#2563EB",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <Inventory2OutlinedIcon />
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Всего оборудования
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                  >
                    {equipment.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Типов */}

          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid #E5E7EB",
              boxShadow: "none",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: "#F0FDF4",
                    color: "#16A34A",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <BuildIcon />
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Типов
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                  >
                    {types.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Найдено */}

          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid #E5E7EB",
              boxShadow: "none",
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: "#FFF7ED",
                    color: "#EA580C",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <SearchIcon />
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Найдено
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                  >
                    {
                      filteredEquipment.length
                    }
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* ===================================================== */}
        {/* EQUIPMENT LIST                                        */}
        {/* ===================================================== */}

        {dataLoading ? (
          <Box
            sx={{
              py: 8,
              display: "flex",
              justifyContent:
                "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : filteredEquipment.length ===
          0 ? (
          <Card
            sx={{
              borderRadius: 3,
              border:
                "1px solid #E5E7EB",
              boxShadow: "none",
            }}
          >
            <CardContent
              sx={{
                py: 8,
                textAlign: "center",
              }}
            >
              <Inventory2OutlinedIcon
                sx={{
                  fontSize: 52,
                  color: "#CBD5E1",
                  mb: 2,
                }}
              />

              <Typography
                variant="h6"
                fontWeight={600}
              >
                Оборудование не найдено
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 1,
                }}
              >
                Добавьте первую модель
                оборудования
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
              },
              gap: 2,
            }}
          >
            {filteredEquipment.map(
              (item) => (
                <Card
                  key={item.id}
                  sx={{
                    borderRadius: 3,
                    border:
                      "1px solid #E5E7EB",
                    boxShadow:
                      "0 2px 8px rgba(15,23,42,.03)",
                    transition:
                      "all .2s ease",

                    "&:hover": {
                      borderColor:
                        "#CBD5E1",
                      boxShadow:
                        "0 8px 24px rgba(15,23,42,.07)",
                      transform:
                        "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2.5,
                    }}
                  >
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              width: 46,
                              height: 46,
                              borderRadius:
                                2.5,
                              bgcolor:
                                "#EFF6FF",
                              color:
                                "#2563EB",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                            }}
                          >
                            <Inventory2OutlinedIcon />
                          </Box>

                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color:
                                  "#2563EB",
                                fontWeight:
                                  600,
                              }}
                            >
                              {
                                item.equipmentTypeName
                              }
                            </Typography>

                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{
                                color:
                                  "#172033",
                              }}
                            >
                              {
                                item.manufacturer
                              }{" "}
                              {item.model}
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={0}
                        >
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            sx={{
                              color:
                                "#64748B",

                              "&:hover": {
                                bgcolor:
                                  "#EFF6FF",
                                color:
                                  "#2563EB",
                              },
                            }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>

                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeleteClick(
                                item
                              )
                            }
                            sx={{
                              color:
                                "#64748B",

                              "&:hover": {
                                bgcolor:
                                  "#FEF2F2",
                                color:
                                  "#DC2626",
                              },
                            }}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>

                      {item.description ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            lineHeight: 1.6,
                          }}
                        >
                          {
                            item.description
                          }
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.disabled"
                          sx={{
                            fontStyle:
                              "italic",
                          }}
                        >
                          Описание не указано
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )
            )}
          </Box>
        )}
      </Box>

      {/* ===================================================== */}
      {/* ADD / EDIT DIALOG                                     */}
      {/* ===================================================== */}

      <Dialog
        open={dialogOpen}
        onClose={() =>
          !saving &&
          setDialogOpen(false)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
          }}
        >
          {editingEquipment
            ? "Редактирование оборудования"
            : "Новое оборудование"}
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 3,
            }}
          >
            Укажите основные данные модели
            оборудования.
          </Typography>

          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel>
                Тип оборудования
              </InputLabel>

              <Select
                value={equipmentTypeId}
                label="Тип оборудования"
                onChange={(e) =>
                  setEquipmentTypeId(
                    e.target.value
                  )
                }
                disabled={saving}
                sx={{
                  borderRadius: 2,
                }}
              >
                {types.map((type) => (
                  <MenuItem
                    key={type.id}
                    value={type.id}
                  >
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Производитель"
              value={manufacturer}
              onChange={(e) =>
                setManufacturer(
                  e.target.value
                )
              }
              disabled={saving}
            />

            <TextField
              fullWidth
              label="Модель"
              value={model}
              onChange={(e) =>
                setModel(e.target.value)
              }
              disabled={saving}
            />

            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Описание"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              disabled={saving}
              placeholder="Дополнительная информация об оборудовании"
            />

            {formError && (
              <Alert severity="error">
                {formError}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button
            onClick={() =>
              setDialogOpen(false)
            }
            disabled={saving}
            sx={{
              textTransform: "none",
            }}
          >
            Отмена
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              textTransform: "none",
              bgcolor: "#2563EB",
              boxShadow: "none",

              "&:hover": {
                bgcolor: "#1D4ED8",
                boxShadow: "none",
              },
            }}
          >
            {saving
              ? "Сохранение..."
              : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================================================== */}
      {/* DELETE DIALOG                                         */}
      {/* ===================================================== */}

      <Dialog
        open={deleteDialogOpen}
        onClose={() =>
          !deleting &&
          setDeleteDialogOpen(false)
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
          }}
        >
          Удалить оборудование?
        </DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Вы действительно хотите удалить
            модель{" "}
            <strong>
              {equipmentToDelete
                ? `${equipmentToDelete.manufacturer} ${equipmentToDelete.model}`
                : ""}
            </strong>
            ?
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button
            onClick={() =>
              setDeleteDialogOpen(false)
            }
            disabled={deleting}
            sx={{
              textTransform: "none",
            }}
          >
            Отмена
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              textTransform: "none",
              boxShadow: "none",
            }}
          >
            {deleting
              ? "Удаление..."
              : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
}