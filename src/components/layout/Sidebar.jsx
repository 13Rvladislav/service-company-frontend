import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";

import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";

import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";


export default function Sidebar({ user }) {
  const location = useLocation();

  const role = user?.role;

  /* ========================================================= */
  /* АКТИВНЫЕ РАЗДЕЛЫ                                         */
  /* ========================================================= */

  const isLocationsPage =
    location.pathname.startsWith("/addresses") ||
    location.pathname.startsWith("/zones");

  const isEquipmentPage =
    location.pathname.startsWith("/equipment");

  /* ========================================================= */
  /* РАСКРЫТИЕ ПОДМЕНЮ                                        */
  /* ========================================================= */

  const [locationsOpen, setLocationsOpen] =
    useState(isLocationsPage);

  const [equipmentOpen, setEquipmentOpen] =
    useState(isEquipmentPage);

  /* ========================================================= */
  /* СТИЛЬ ОБЫЧНОГО ПУНКТА                                    */
  /* ========================================================= */

  const mainItemSx = {
    minHeight: 44,
    px: 1.5,
    borderRadius: 2,
    mb: 0.5,

    color: "#CBD5E1",

    transition: "all .15s ease",

    "& .MuiListItemIcon-root": {
      color: "#94A3B8",
      transition: "color .15s ease",
    },

    "&:hover": {
      backgroundColor: "rgba(255,255,255,0.08)",
      color: "#FFFFFF",

      "& .MuiListItemIcon-root": {
        color: "#FFFFFF",
      },
    },

    "&.active": {
      backgroundColor: "#2563EB",
      color: "#FFFFFF",

      boxShadow:
        "0 4px 12px rgba(37,99,235,.30)",

      "& .MuiListItemIcon-root": {
        color: "#FFFFFF",
      },

      "&:hover": {
        backgroundColor: "#2563EB",
      },
    },
  };

  /* ========================================================= */
  /* СТИЛЬ ВЛОЖЕННЫХ ПУНКТОВ                                 */
  /* ========================================================= */

  const nestedItemSx = {
    minHeight: 40,
    px: 1.5,
    pl: 2,

    borderRadius: 2,
    mb: 0.5,

    color: "#CBD5E1",

    transition: "all .15s ease",

    "& .MuiListItemIcon-root": {
      color: "#94A3B8",
      transition: "color .15s ease",
    },

    "&:hover": {
      backgroundColor:
        "rgba(255,255,255,0.08)",

      color: "#FFFFFF",

      "& .MuiListItemIcon-root": {
        color: "#FFFFFF",
      },
    },

    "&.active": {
      backgroundColor:
        "rgba(37,99,235,.95)",

      color: "#FFFFFF",

      boxShadow:
        "inset 3px 0 0 #93C5FD",

      "& .MuiListItemIcon-root": {
        color: "#FFFFFF",
      },

      "&:hover": {
        backgroundColor:
          "rgba(37,99,235,.95)",
      },
    },
  };

  /* ========================================================= */
  /* ГРУППА ЛОКАЦИИ                                           */
  /* ========================================================= */

  const locationsGroupSx = {
    minHeight: 44,
    px: 1.5,

    borderRadius: 2,
    mb: 0.5,

    color: "#CBD5E1",

    transition: "all .15s ease",

    "& .MuiListItemIcon-root": {
      color: "#94A3B8",
    },

    "&:hover": {
      backgroundColor:
        "rgba(255,255,255,0.08)",

      color: "#FFFFFF",

      "& .MuiListItemIcon-root": {
        color: "#FFFFFF",
      },
    },

    ...(isLocationsPage && {
      backgroundColor:
        "rgba(255,255,255,.08)",

      color: "#FFFFFF",

      "& .MuiListItemIcon-root": {
        color: "#FFFFFF",
      },
    }),
  };

  /* ========================================================= */
  /* ГРУППА ОБОРУДОВАНИЕ                                     */
  /* ========================================================= */

  const equipmentGroupSx = {
    minHeight: 44,
    px: 1.5,

    borderRadius: 2,
    mb: 0.5,

    color: "#CBD5E1",

    transition: "all .15s ease",

    "& .MuiListItemIcon-root": {
      color: "#94A3B8",
    },

    "&:hover": {
      backgroundColor:
        "rgba(255,255,255,0.08)",

      color: "#FFFFFF",

      "& .MuiListItemIcon-root": {
        color: "#FFFFFF",
      },
    },

    ...(isEquipmentPage && {
      backgroundColor:
        "rgba(255,255,255,.08)",

      color: "#FFFFFF",

      "& .MuiListItemIcon-root": {
        color: "#FFFFFF",
      },
    }),
  };

  /* ========================================================= */
  /* ОБЫЧНЫЙ ПУНКТ                                            */
  /* ========================================================= */

  const renderItem = (
    to,
    label,
    Icon,
    end = false
  ) => {
    return (
      <ListItem
        key={to}
        disablePadding
      >
        <ListItemButton
          component={NavLink}
          to={to}
          end={end}
          sx={mainItemSx}
        >
          <ListItemIcon
            sx={{
              minWidth: 38,
            }}
          >
            <Icon />
          </ListItemIcon>

          <ListItemText
            primary={label}
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: 500,
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  /* ========================================================= */
  /* ЛОКАЦИИ                                                   */
  /* ========================================================= */

  const renderLocations = () => {
    return (
      <>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() =>
              setLocationsOpen(
                (prev) => !prev
              )
            }
            sx={locationsGroupSx}
          >
            <ListItemIcon
              sx={{
                minWidth: 38,
              }}
            >
              <LocationOnOutlinedIcon />
            </ListItemIcon>

            <ListItemText
              primary="Локации"
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: 500,
              }}
            />

            {locationsOpen ? (
              <ExpandMoreIcon
                sx={{
                  fontSize: 20,
                  color: "#94A3B8",
                }}
              />
            ) : (
              <ChevronRightIcon
                sx={{
                  fontSize: 20,
                  color: "#94A3B8",
                }}
              />
            )}
          </ListItemButton>
        </ListItem>

        <Collapse
          in={locationsOpen}
          timeout="auto"
          unmountOnExit
        >
          <List
            disablePadding
            sx={{
              pl: 2,
              pr: 0.5,
              position: "relative",

              "&::before": {
                content: '""',

                position: "absolute",
                left: 14,
                top: 0,
                bottom: 8,

                width: 1,

                backgroundColor:
                  "rgba(148,163,184,.22)",
              },
            }}
          >
            {/* АДРЕСА */}

            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/addresses"
                sx={nestedItemSx}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                  }}
                >
                  <HomeWorkOutlinedIcon
                    sx={{
                      fontSize: 20,
                    }}
                  />
                </ListItemIcon>

                <ListItemText
                  primary="Адреса"
                  primaryTypographyProps={{
                    fontSize: 14,
                  }}
                />
              </ListItemButton>
            </ListItem>

            {/* ЗОНЫ */}

            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/zones"
                sx={nestedItemSx}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                  }}
                >
                  <MapOutlinedIcon
                    sx={{
                      fontSize: 20,
                    }}
                  />
                </ListItemIcon>

                <ListItemText
                  primary="Зоны"
                  primaryTypographyProps={{
                    fontSize: 14,
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>
      </>
    );
  };

  /* ========================================================= */
  /* ОБОРУДОВАНИЕ                                              */
  /* ========================================================= */

  const renderEquipment = () => {
    return (
      <>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() =>
              setEquipmentOpen(
                (prev) => !prev
              )
            }
            sx={equipmentGroupSx}
          >
            <ListItemIcon
              sx={{
                minWidth: 38,
              }}
            >
              <BuildOutlinedIcon />
            </ListItemIcon>

            <ListItemText
              primary="Оборудование"
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: 500,
              }}
            />

            {equipmentOpen ? (
              <ExpandMoreIcon
                sx={{
                  fontSize: 20,
                  color: "#94A3B8",
                }}
              />
            ) : (
              <ChevronRightIcon
                sx={{
                  fontSize: 20,
                  color: "#94A3B8",
                }}
              />
            )}
          </ListItemButton>
        </ListItem>

        <Collapse
          in={equipmentOpen}
          timeout="auto"
          unmountOnExit
        >
          <List
            disablePadding
            sx={{
              pl: 2,
              pr: 0.5,
              position: "relative",

              "&::before": {
                content: '""',

                position: "absolute",
                left: 14,
                top: 0,
                bottom: 8,

                width: 1,

                backgroundColor:
                  "rgba(148,163,184,.22)",
              },
            }}
          >
            {/* ТИПЫ ОБОРУДОВАНИЯ */}

            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/equipment/types"
                sx={nestedItemSx}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                  }}
                >
                  <CategoryOutlinedIcon
                    sx={{
                      fontSize: 20,
                    }}
                  />
                </ListItemIcon>

                <ListItemText
                  primary="Типы оборудования"
                  primaryTypographyProps={{
                    fontSize: 14,
                  }}
                />
              </ListItemButton>
            </ListItem>

            {/* ОБОРУДОВАНИЕ */}

            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/equipment"
                end
                sx={nestedItemSx}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                  }}
                >
                  <Inventory2OutlinedIcon
                    sx={{
                      fontSize: 20,
                    }}
                  />
                </ListItemIcon>

                <ListItemText
                  primary="Оборудование"
                  primaryTypographyProps={{
                    fontSize: 14,
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>
      </>
    );
  };

  /* ========================================================= */
  /* ADMIN                                                     */
  /* ========================================================= */

  const renderAdminMenu = () => {
    return (
      <>
        <SectionTitle>
          ОБЩЕЕ
        </SectionTitle>

        {renderItem(
          "/dashboard",
          "Главная",
          DashboardOutlinedIcon,
          true
        )}

        {renderItem(
          "/profile",
          "Профиль",
          PersonOutlineOutlinedIcon
        )}

        <SectionTitle>
          РАБОТА
        </SectionTitle>

        {renderItem(
          "/requests",
          "Все заявки",
          AssignmentOutlinedIcon
        )}

        <SectionTitle>
          АДМИНИСТРИРОВАНИЕ
        </SectionTitle>

        {renderItem(
          "/users",
          "Пользователи",
          PeopleOutlineOutlinedIcon
        )}

        {renderLocations()}

        {renderEquipment()}
      </>
    );
  };

  /* ========================================================= */
  /* CLIENT                                                    */
  /* ========================================================= */

  const renderClientMenu = () => {
    return (
      <>
        <SectionTitle>
          ОБЩЕЕ
        </SectionTitle>

        {renderItem(
          "/dashboard",
          "Главная",
          DashboardOutlinedIcon,
          true
        )}

        {renderItem(
          "/profile",
          "Профиль",
          PersonOutlineOutlinedIcon
        )}

        <SectionTitle>
          РАБОТА
        </SectionTitle>

        {renderItem(
          "/my-requests",
          "Мои заявки",
          AssignmentOutlinedIcon
        )}

        {renderItem(
          "/my-equipment",
          "Моё оборудование",
          BuildOutlinedIcon
        )}
      </>
    );
  };

  /* ========================================================= */
  /* DISPATCHER                                                */
  /* ========================================================= */

  const renderDispatcherMenu = () => {
    return (
      <>
        <SectionTitle>
          ОБЩЕЕ
        </SectionTitle>

        {renderItem(
          "/dashboard",
          "Главная",
          DashboardOutlinedIcon,
          true
        )}

        {renderItem(
          "/profile",
          "Профиль",
          PersonOutlineOutlinedIcon
        )}

        <SectionTitle>
          РАБОТА
        </SectionTitle>

        {renderItem(
          "/requests",
          "Заявки",
          AssignmentOutlinedIcon
        )}
      </>
    );
  };

  /* ========================================================= */
  /* ENGINEER                                                  */
  /* ========================================================= */

  const renderEngineerMenu = () => {
    return (
      <>
        <SectionTitle>
          ОБЩЕЕ
        </SectionTitle>

        {renderItem(
          "/dashboard",
          "Главная",
          DashboardOutlinedIcon,
          true
        )}

        {renderItem(
          "/profile",
          "Профиль",
          PersonOutlineOutlinedIcon
        )}

        <SectionTitle>
          РАБОТА
        </SectionTitle>

        {renderItem(
          "/requests",
          "Мои заявки",
          AssignmentOutlinedIcon
        )}
      </>
    );
  };

  /* ========================================================= */
  /* RENDER                                                     */
  /* ========================================================= */

  return (
    <Box
      sx={{
        width: 220,
        minWidth: 220,

        height: "100vh",

        position: "fixed",
        left: 0,
        top: 0,

        zIndex: 1200,

        display: "flex",
        flexDirection: "column",

        backgroundColor: "#1E3A8A",

        color: "#FFFFFF",

        overflowY: "auto",

        "&::-webkit-scrollbar": {
          width: 5,
        },

        "&::-webkit-scrollbar-thumb": {
          backgroundColor:
            "rgba(255,255,255,.2)",

          borderRadius: 10,
        },
      }}
    >
      {/* ===================================================== */}
      {/* ЛОГОТИП                                               */}
      {/* ===================================================== */}

      <Box
        sx={{
          height: 72,

          px: 2.5,

          display: "flex",
          alignItems: "center",

          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          spacing={1.2}
          alignItems="center"
        >
          <Box
            sx={{
              width: 36,
              height: 36,

              borderRadius: 2,

              backgroundColor:
                "rgba(255,255,255,.15)",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EngineeringOutlinedIcon />
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              Service
            </Typography>

            <Typography
              sx={{
                fontSize: 11,
                color: "#BFDBFE",
                lineHeight: 1.1,
              }}
            >
              Company
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider
        sx={{
          borderColor:
            "rgba(255,255,255,.12)",
        }}
      />

      {/* ===================================================== */}
      {/* МЕНЮ                                                  */}
      {/* ===================================================== */}

      <Box
        sx={{
          px: 1.2,
          py: 2,
          flex: 1,
        }}
      >
        {role === "ADMIN" &&
          renderAdminMenu()}

        {role === "CLIENT" &&
          renderClientMenu()}

        {role === "DISPATCHER" &&
          renderDispatcherMenu()}

        {role === "ENGINEER" &&
          renderEngineerMenu()}
      </Box>
    </Box>
  );
}


/* ========================================================= */
/* ЗАГОЛОВОК РАЗДЕЛА                                         */
/* ========================================================= */

function SectionTitle({ children }) {
  return (
    <Typography
      sx={{
        px: 1.5,

        pt: 2,
        pb: 1,

        fontSize: 10,
        fontWeight: 700,

        letterSpacing: 0.8,

        color: "#93C5FD",
      }}
    >
      {children}
    </Typography>
  );
}