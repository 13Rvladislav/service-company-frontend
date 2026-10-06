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
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

import MainLayout from "../components/layout/MainLayout";

import {
  getEquipmentTypes,
  createEquipmentType,
  updateEquipmentType,
  deleteEquipmentType,
} from "../api/equipmentApi";

import { getCurrentProfile } from "../api/userApi";

export default function EquipmentTypesPage() {
  /* ========================================================= */
  /* USER                                                        */
  /* ========================================================= */

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ========================================================= */
  /* TYPES                                                       */
  /* ========================================================= */

  const [types, setTypes] = useState([]);
  const [typesLoading, setTypesLoading] =
    useState(false);

  const [error, setError] = useState("");

  /* ========================================================= */
  /* SEARCH                                                      */
  /* ========================================================= */

  const [search, setSearch] = useState("");

  /* ========================================================= */
  /* DIALOG                                                      */
  /* ========================================================= */

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [editingType, setEditingType] =
    useState(null);

  const [name, setName] = useState("");

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState("");

  /* ========================================================= */
  /* DELETE                                                      */
  /* ========================================================= */

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [typeToDelete, setTypeToDelete] =
    useState(null);

  const [deleting, setDeleting] = useState(false);

  /* ========================================================= */
  /* LOAD                                                        */
  /* ========================================================= */

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    try {
      setLoading(true);

      const profile = await getCurrentProfile();

      setUser(profile);

      await loadTypes();
    } catch (err) {
      console.error(err);

      setError(
        "Не удалось загрузить типы оборудования"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTypes = async () => {
    try {
      setTypesLoading(true);
      setError("");

      const data = await getEquipmentTypes();

      setTypes(data || []);
    } catch (err) {
      console.error(err);

      setError(
        "Не удалось загрузить типы оборудования"
      );
    } finally {
      setTypesLoading(false);
    }
  };

  /* ========================================================= */
  /* SEARCH                                                      */
  /* ========================================================= */

  const filteredTypes = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return types;
    }

    return types.filter((type) =>
      type.name
        ?.toLowerCase()
        .includes(value)
    );
  }, [types, search]);

  /* ========================================================= */
  /* ADD                                                         */
  /* ========================================================= */

  const handleAdd = () => {
    setEditingType(null);
    setName("");
    setFormError("");
    setDialogOpen(true);
  };

  /* ========================================================= */
  /* EDIT                                                        */
  /* ========================================================= */

  const handleEdit = (type) => {
    setEditingType(type);
    setName(type.name || "");
    setFormError("");
    setDialogOpen(true);
  };

  /* ========================================================= */
  /* SAVE                                                        */
  /* ========================================================= */

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError(
        "Введите название типа оборудования"
      );

      return;
    }

    try {
      setSaving(true);
      setFormError("");

      let saved;

      if (editingType) {
        saved = await updateEquipmentType(
          editingType.id,
          {
            name: trimmedName,
          }
        );

        setTypes((prev) =>
          prev.map((item) =>
            item.id === saved.id
              ? saved
              : item
          )
        );
      } else {
        saved = await createEquipmentType({
          name: trimmedName,
        });

        setTypes((prev) => [
          ...prev,
          saved,
        ]);
      }

      setDialogOpen(false);
      setEditingType(null);
      setName("");
    } catch (err) {
      console.error(err);

      if (err.response?.status === 409) {
        setFormError(
          "Тип оборудования с таким названием уже существует"
        );
      } else {
        setFormError(
          "Не удалось сохранить тип оборудования"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /* ========================================================= */
  /* DELETE                                                      */
  /* ========================================================= */

  const handleDeleteClick = (type) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!typeToDelete) {
      return;
    }

    try {
      setDeleting(true);

      await deleteEquipmentType(
        typeToDelete.id
      );

      setTypes((prev) =>
        prev.filter(
          (item) =>
            item.id !== typeToDelete.id
        )
      );

      setDeleteDialogOpen(false);
      setTypeToDelete(null);
    } catch (err) {
      console.error(err);

      setError(
        "Не удалось удалить тип оборудования"
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
          maxWidth: 1200,
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
                <CategoryIcon
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
                  Типы оборудования
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Управление категориями оборудования
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
              Добавить тип
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
        {/* SEARCH                                                */}
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
            <TextField
              fullWidth
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Поиск по названию..."
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        color: "#94A3B8",
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
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
              sm: "repeat(2, 1fr)",
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
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CategoryIcon />
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Всего типов
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
                    bgcolor: "#F0FDF4",
                    color: "#16A34A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Inventory2OutlinedIcon />
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
                    {filteredTypes.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* ===================================================== */}
        {/* LIST                                                   */}
        {/* ===================================================== */}

        {typesLoading ? (
          <Box
            sx={{
              py: 8,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : filteredTypes.length === 0 ? (
          <Card
            sx={{
              borderRadius: 3,
              border: "1px solid #E5E7EB",
              boxShadow: "none",
            }}
          >
            <CardContent
              sx={{
                py: 8,
                textAlign: "center",
              }}
            >
              <CategoryIcon
                sx={{
                  fontSize: 48,
                  color: "#CBD5E1",
                  mb: 2,
                }}
              />

              <Typography
                variant="h6"
                fontWeight={600}
              >
                Типы оборудования не найдены
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 1,
                }}
              >
                Добавьте первый тип оборудования
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {filteredTypes.map(
              (type, index) => (
                <Card
                  key={type.id}
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
                        "0 6px 20px rgba(15,23,42,.06)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      py: 1.5,
                      "&:last-child": {
                        pb: 1.5,
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                      >
                        {/* Номер */}

                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: "#EFF6FF",
                            color: "#2563EB",
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontWeight: 700,
                          }}
                        >
                          {index + 1}
                        </Box>

                        {/* Название */}

                        <Box>
                          <Typography
                            fontWeight={600}
                            sx={{
                              color:
                                "#172033",
                            }}
                          >
                            {type.name}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Тип оборудования
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Действия */}

                      <Stack
                        direction="row"
                        spacing={0.5}
                      >
                        <IconButton
                          onClick={() =>
                            handleEdit(type)
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
                          <EditOutlinedIcon />
                        </IconButton>

                        <IconButton
                          onClick={() =>
                            handleDeleteClick(
                              type
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
                          <DeleteOutlineOutlinedIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              )
            )}
          </Stack>
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
            pb: 1,
          }}
        >
          {editingType
            ? "Редактирование типа"
            : "Новый тип оборудования"}
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 3,
            }}
          >
            {editingType
              ? "Измените название типа оборудования."
              : "Введите название нового типа оборудования."}
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Название"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            error={Boolean(formError)}
            helperText={formError}
            disabled={saving}
          />
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
          Удалить тип оборудования?
        </DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Вы действительно хотите удалить тип
            «{typeToDelete?.name}»?
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