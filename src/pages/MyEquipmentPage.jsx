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
  getMyEquipment,
  createMyEquipment,
  updateMyEquipment,
  deleteMyEquipment,
} from "../api/equipmentApi";

import { getCurrentProfile } from "../api/userApi";


export default function MyEquipmentPage() {

  /* ========================================================= */
  /* USER                                                       */
  /* ========================================================= */

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  /* ========================================================= */
  /* DATA                                                       */
  /* ========================================================= */

  const [equipment, setEquipment] = useState([]);
  const [types, setTypes] = useState([]);
  const [catalog, setCatalog] = useState([]);

  const [dataLoading, setDataLoading] = useState(false);

  const [error, setError] = useState("");


  /* ========================================================= */
  /* SEARCH                                                     */
  /* ========================================================= */

  const [search, setSearch] = useState("");


  /* ========================================================= */
  /* ADD / EDIT                                                 */
  /* ========================================================= */

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingEquipment, setEditingEquipment] =
    useState(null);

  const [selectedType, setSelectedType] =
    useState("");

  const [selectedCatalog, setSelectedCatalog] =
    useState("");

  const [serialNumber, setSerialNumber] =
    useState("");

  const [installationDate, setInstallationDate] =
    useState("");

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] =
    useState("");


  /* ========================================================= */
  /* DELETE                                                     */
  /* ========================================================= */

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [equipmentToDelete, setEquipmentToDelete] =
    useState(null);

  const [deleting, setDeleting] = useState(false);


  /* ========================================================= */
  /* LOAD                                                       */
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
        "Не удалось загрузить оборудование"
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
        catalogData,
        equipmentData,
      ] = await Promise.all([
        getEquipmentTypes(),
        getEquipmentCatalog(),
        getMyEquipment(),
      ]);

      setTypes(typesData || []);
      setCatalog(catalogData || []);
      setEquipment(equipmentData || []);

    } catch (err) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        "Не удалось загрузить оборудование"
      );

    } finally {

      setDataLoading(false);
    }
  };


  /* ========================================================= */
  /* FILTER                                                     */
  /* ========================================================= */

  const filteredEquipment = useMemo(() => {

    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return equipment;
    }

    return equipment.filter((item) => {

      const values = [
        item.equipmentTypeName,
        item.manufacturer,
        item.model,
        item.serialNumber,
        item.description,
      ];

      return values.some((value) =>
        value
          ?.toString()
          .toLowerCase()
          .includes(searchValue)
      );
    });

  }, [equipment, search]);


  /* ========================================================= */
  /* CATALOG BY TYPE                                            */
  /* ========================================================= */

  const filteredCatalog = useMemo(() => {

    if (!selectedType) {
      return [];
    }

    return catalog.filter(
      (item) =>
        String(item.equipmentTypeId) ===
        String(selectedType)
    );

  }, [
    catalog,
    selectedType,
  ]);


  /* ========================================================= */
  /* ADD                                                        */
  /* ========================================================= */

  const handleAdd = () => {

    setEditingEquipment(null);

    setSelectedType("");
    setSelectedCatalog("");
    setSerialNumber("");
    setInstallationDate("");

    setFormError("");

    setDialogOpen(true);
  };


  /* ========================================================= */
  /* EDIT                                                       */
  /* ========================================================= */

  const handleEdit = (item) => {

    setEditingEquipment(item);

    setSelectedType(
      item.equipmentTypeId || ""
    );

    setSelectedCatalog(
      item.equipmentCatalogId || ""
    );

    setSerialNumber(
      item.serialNumber || ""
    );

    setInstallationDate(
      item.installationDate || ""
    );

    setFormError("");

    setDialogOpen(true);
  };


  /* ========================================================= */
  /* TYPE CHANGE                                                */
  /* ========================================================= */

  const handleTypeChange = (event) => {

    const value = event.target.value;

    setSelectedType(value);

    /*
     * При смене типа старая модель больше
     * не должна оставаться выбранной.
     */
    setSelectedCatalog("");
  };


  /* ========================================================= */
  /* SAVE                                                       */
  /* ========================================================= */

  const handleSave = async () => {

    if (!selectedType) {

      setFormError(
        "Выберите тип оборудования"
      );

      return;
    }

    if (!selectedCatalog) {

      setFormError(
        "Выберите оборудование"
      );

      return;
    }

    try {

      setSaving(true);
      setFormError("");

      const payload = {

        equipmentCatalogId:
          selectedCatalog,

        serialNumber:
          serialNumber.trim() || null,

        installationDate:
          installationDate || null,
      };


      if (editingEquipment) {

        await updateMyEquipment(
          editingEquipment.id,
          payload
        );

      } else {

        await createMyEquipment(
          payload
        );
      }


      setDialogOpen(false);

      setEditingEquipment(null);

      await loadData();

    } catch (err) {

      console.error(err);

      setFormError(
        err?.response?.data?.message ||
        "Не удалось сохранить оборудование"
      );

    } finally {

      setSaving(false);
    }
  };


  /* ========================================================= */
  /* DELETE                                                     */
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

      await deleteMyEquipment(
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
        err?.response?.data?.message ||
        "Не удалось удалить оборудование"
      );

    } finally {

      setDeleting(false);
    }
  };


  /* ========================================================= */
  /* DATE                                                       */
  /* ========================================================= */

  const formatDate = (date) => {

    if (!date) {
      return "Не указана";
    }

    const parts = date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };


  /* ========================================================= */
  /* LOADING                                                    */
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
  /* PAGE                                                       */
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

        {/* =================================================== */}
        {/* HEADER                                               */}
        {/* =================================================== */}

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

            {/* TITLE */}

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
                  Моё оборудование
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Оборудование, установленное у вас
                </Typography>

              </Box>

            </Stack>


            {/* ADD BUTTON */}

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


        {/* =================================================== */}
        {/* ERROR                                                */}
        {/* =================================================== */}

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


        {/* =================================================== */}
        {/* SEARCH                                               */}
        {/* =================================================== */}

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
              placeholder="Поиск по типу, производителю, модели, серийному номеру..."
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


        {/* =================================================== */}
        {/* STATISTICS                                           */}
        {/* =================================================== */}

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

          {/* TOTAL */}

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

                  <Inventory2OutlinedIcon />

                </Box>


                <Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Моё оборудование
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


          {/* TYPES */}

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

                  <BuildIcon />

                </Box>


                <Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Типов оборудования
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


          {/* FOUND */}

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
                    alignItems: "center",
                    justifyContent: "center",
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
                    {filteredEquipment.length}
                  </Typography>

                </Box>

              </Stack>

            </CardContent>

          </Card>

        </Box>


        {/* =================================================== */}
        {/* LIST                                                  */}
        {/* =================================================== */}

        {dataLoading ? (

          <Box
            sx={{
              py: 8,
              display: "flex",
              justifyContent: "center",
            }}
          >

            <CircularProgress />

          </Box>

        ) : filteredEquipment.length === 0 ? (

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
                Добавьте оборудование,
                установленное у вас
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

                      {/* HEADER CARD */}

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
                              borderRadius: 2.5,
                              bgcolor: "#EFF6FF",
                              color: "#2563EB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >

                            <Inventory2OutlinedIcon />

                          </Box>


                          <Box>

                            <Typography
                              variant="caption"
                              sx={{
                                color: "#2563EB",
                                fontWeight: 600,
                              }}
                            >
                              {item.equipmentTypeName}
                            </Typography>


                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{
                                color: "#172033",
                              }}
                            >
                              {item.manufacturer}{" "}
                              {item.model}
                            </Typography>

                          </Box>

                        </Stack>


                        {/* ACTIONS */}

                        <Stack
                          direction="row"
                          spacing={0}
                        >

                          <IconButton
                            size="small"
                            onClick={() =>
                              handleEdit(item)
                            }
                            sx={{
                              color: "#64748B",

                              "&:hover": {
                                bgcolor: "#EFF6FF",
                                color: "#2563EB",
                              },
                            }}
                          >

                            <EditOutlinedIcon
                              fontSize="small"
                            />

                          </IconButton>


                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeleteClick(item)
                            }
                            sx={{
                              color: "#64748B",

                              "&:hover": {
                                bgcolor: "#FEF2F2",
                                color: "#DC2626",
                              },
                            }}
                          >

                            <DeleteOutlineOutlinedIcon
                              fontSize="small"
                            />

                          </IconButton>

                        </Stack>

                      </Stack>


                      {/* DETAILS */}

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                          gap: 2,
                          pt: 0.5,
                        }}
                      >

                        <Box>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Серийный номер
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{
                              mt: 0.3,
                            }}
                          >
                            {item.serialNumber ||
                              "Не указан"}
                          </Typography>

                        </Box>


                        <Box>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Дата установки
                          </Typography>

                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{
                              mt: 0.3,
                            }}
                          >
                            {formatDate(
                              item.installationDate
                            )}
                          </Typography>

                        </Box>

                      </Box>


                      {/* DESCRIPTION */}

                      {item.description ? (

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            lineHeight: 1.6,
                          }}
                        >
                          {item.description}
                        </Typography>

                      ) : (

                        <Typography
                          variant="body2"
                          color="text.disabled"
                          sx={{
                            fontStyle: "italic",
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
            : "Добавить оборудование"}
        </DialogTitle>


        <DialogContent>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 3,
            }}
          >
            Сначала выберите тип оборудования,
            затем конкретную модель.
          </Typography>


          <Stack spacing={2.5}>

            {/* ================================================= */}
            {/* TYPE                                               */}
            {/* ================================================= */}

            <FormControl
              fullWidth
              disabled={saving}
            >

              <InputLabel>
                Тип оборудования
              </InputLabel>

              <Select
                value={selectedType}
                label="Тип оборудования"
                onChange={handleTypeChange}
                sx={{
                  borderRadius: 2,
                }}
              >

                <MenuItem value="">
                  <em>Выберите тип</em>
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


            {/* ================================================= */}
            {/* EQUIPMENT                                         */}
            {/* ================================================= */}

            <FormControl
              fullWidth
              disabled={
                saving ||
                !selectedType
              }
            >

              <InputLabel>
                Оборудование
              </InputLabel>

              <Select
                value={selectedCatalog}
                label="Оборудование"
                onChange={(e) =>
                  setSelectedCatalog(
                    e.target.value
                  )
                }
                sx={{
                  borderRadius: 2,
                }}
              >

                <MenuItem value="">
                  <em>
                    {selectedType
                      ? "Выберите модель"
                      : "Сначала выберите тип"}
                  </em>
                </MenuItem>

                {filteredCatalog.map(
                  (item) => (

                    <MenuItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.manufacturer}
                      {" — "}
                      {item.model}
                    </MenuItem>

                  )
                )}

              </Select>

            </FormControl>


            {/* ================================================= */}
            {/* SERIAL NUMBER                                     */}
            {/* ================================================= */}

            <TextField
              fullWidth
              label="Серийный номер"
              value={serialNumber}
              onChange={(e) =>
                setSerialNumber(
                  e.target.value
                )
              }
              disabled={saving}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />


            {/* ================================================= */}
            {/* INSTALLATION DATE                                 */}
            {/* ================================================= */}

            <TextField
              fullWidth
              type="date"
              label="Дата установки"
              value={installationDate}
              onChange={(e) =>
                setInstallationDate(
                  e.target.value
                )
              }
              disabled={saving}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },

                /*
                 * Дополнительная фиксация положения
                 * label для date input.
                 */
                "& .MuiInputLabel-root": {
                  backgroundColor: "#FFFFFF",
                  px: 0.5,
                },
              }}
            />


            {/* ================================================= */}
            {/* ERROR                                              */}
            {/* ================================================= */}

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
            disabled={
              saving ||
              !selectedType ||
              !selectedCatalog
            }
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

            Вы действительно хотите удалить{" "}

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