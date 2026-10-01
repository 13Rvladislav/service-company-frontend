import { NavLink } from "react-router-dom";

import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EngineeringIcon from "@mui/icons-material/Engineering";
import GroupIcon from "@mui/icons-material/Group";
import MapIcon from "@mui/icons-material/Map";
import LocationCityIcon from "@mui/icons-material/LocationCity";

const Sidebar = ({ user }) => {
  const role = user?.role;

  let menu = [];

  switch (role) {
    case "ADMIN":
      menu = [
        {
          text: "Главная",
          icon: <DashboardIcon />,
          path: "/dashboard",
        },
        {
          text: "Профиль",
          icon: <PersonIcon />,
          path: "/profile",
        },
        {
          text: "Все заявки",
          icon: <AssignmentIcon />,
          path: "/requests",
        },
        {
          text: "Пользователи",
          icon: <GroupIcon />,
          path: "/users",
        },
        {
          text: "Зоны",
          icon: <MapIcon />,
          path: "/zones",
        },
        {
          text: "Адреса",
          icon: <LocationCityIcon />,
          path: "/addresses",
        },
        {
          text: "Оборудование",
          icon: <EngineeringIcon />,
          path: "/equipment",
        },
      ];
      break;

    case "DISPATCHER":
      menu = [
        {
          text: "Главная",
          icon: <DashboardIcon />,
          path: "/dashboard",
        },
        {
          text: "Профиль",
          icon: <PersonIcon />,
          path: "/profile",
        },
        {
          text: "Все заявки",
          icon: <AssignmentIcon />,
          path: "/requests",
        },
        {
          text: "Мастера",
          icon: <EngineeringIcon />,
          path: "/masters",
        },
      ];
      break;

    case "ENGINEER":
      menu = [
        {
          text: "Главная",
          icon: <DashboardIcon />,
          path: "/dashboard",
        },
        {
          text: "Профиль",
          icon: <PersonIcon />,
          path: "/profile",
        },
        {
          text: "Мои заявки",
          icon: <AssignmentIcon />,
          path: "/requests",
        },
      ];
      break;

    default:
      menu = [
        {
          text: "Главная",
          icon: <DashboardIcon />,
          path: "/dashboard",
        },
        {
          text: "Профиль",
          icon: <PersonIcon />,
          path: "/profile",
        },
        {
          text: "Мои заявки",
          icon: <AssignmentIcon />,
          path: "/requests",
        },
        {
          text: "Оборудование",
          icon: <EngineeringIcon />,
          path: "/equipment",
        },
      ];
  }

  return (
    <Box
      sx={{
        width: 220,
        height: "100vh",
        bgcolor: "#1E3A8A",
        color: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Логотип */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Service
        </Typography>

        <Typography
          variant="body2"
          sx={{
            opacity: 0.8,
          }}
        >
          Company
        </Typography>
      </Box>

      <Divider
        sx={{
          bgcolor: "rgba(255,255,255,.15)",
        }}
      />

      {/* Навигация */}
      <List
        sx={{
          px: 1,
          py: 2,
        }}
      >
        {menu.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: "white",

              "&.active": {
                bgcolor: "#2563EB",
              },

              "&:hover": {
                bgcolor: "#3156B8",
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: "white",
                minWidth: 36,
              }}
            >
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.text}
            />
          </ListItemButton>
        ))}
      </List>

      {/* Заполняем свободное место */}
      <Box sx={{ flexGrow: 1 }} />

      <Divider
        sx={{
          bgcolor: "rgba(255,255,255,.15)",
        }}
      />

      {/* Версия */}
      <Box sx={{ p: 2 }}>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.7,
          }}
        >
          Version 1.0.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;