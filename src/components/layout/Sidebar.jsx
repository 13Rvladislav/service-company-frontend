
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
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export default function Sidebar({ user }) {
  const location = useLocation();
  const role = user?.role;

  const isLocationsPage =
    location.pathname.startsWith("/addresses") ||
    location.pathname === "/zones";

  const isEquipmentPage = location.pathname.startsWith("/equipment");

  const isSpecializationsPage =
    location.pathname.startsWith("/specializations");

  const isAdminMastersPage =
    isSpecializationsPage ||
    location.pathname.startsWith("/zones/assign");

  const isDispatcherZonesPage = location.pathname.startsWith("/zones/assign");

  const [locationsOpen, setLocationsOpen] = useState(isLocationsPage);
  const [equipmentOpen, setEquipmentOpen] = useState(isEquipmentPage);
  const [specializationsOpen, setSpecializationsOpen] =
    useState(isAdminMastersPage || isDispatcherZonesPage);

  const mainItemSx = {
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
      backgroundColor: "rgba(255,255,255,.08)",
      color: "#FFFFFF",
      "& .MuiListItemIcon-root": { color: "#FFFFFF" },
    },
    "&.active": {
      backgroundColor: "#2563EB",
      color: "#FFFFFF",
      boxShadow: "0 4px 12px rgba(37,99,235,.30)",
      "& .MuiListItemIcon-root": { color: "#FFFFFF" },
    },
  };

  const nestedItemSx = {
    minHeight: 40,
    px: 1.5,
    pl: 2,
    borderRadius: 2,
    mb: 0.5,
    color: "#CBD5E1",
    "& .MuiListItemIcon-root": { color: "#94A3B8" },
    "&:hover": {
      backgroundColor: "rgba(255,255,255,.08)",
      color: "#FFFFFF",
      "& .MuiListItemIcon-root": { color: "#FFFFFF" },
    },
    "&.active": {
      backgroundColor: "rgba(37,99,235,.95)",
      color: "#FFFFFF",
      boxShadow: "inset 3px 0 0 #93C5FD",
      "& .MuiListItemIcon-root": { color: "#FFFFFF" },
    },
  };

  const groupSx = (active) => ({
    minHeight: 44,
    px: 1.5,
    borderRadius: 2,
    mb: 0.5,
    color: active ? "#FFFFFF" : "#CBD5E1",
    backgroundColor: active ? "rgba(255,255,255,.08)" : "transparent",
    "& .MuiListItemIcon-root": {
      color: active ? "#FFFFFF" : "#94A3B8",
    },
    "&:hover": {
      backgroundColor: "rgba(255,255,255,.08)",
      color: "#FFFFFF",
      "& .MuiListItemIcon-root": { color: "#FFFFFF" },
    },
  });

  const nestedListSx = {
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
      backgroundColor: "rgba(148,163,184,.22)",
    },
  };

  const renderItem = (to, label, Icon, end = false) => (
    <ListItem key={to} disablePadding>
      <ListItemButton
        component={NavLink}
        to={to}
        end={end}
        sx={mainItemSx}
      >
        <ListItemIcon sx={{ minWidth: 38 }}>
          <Icon />
        </ListItemIcon>

        <ListItemText
          primary={label}
          primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
        />
      </ListItemButton>
    </ListItem>
  );

  const renderNestedItem = (to, label, Icon, end = false) => (
    <ListItem key={to} disablePadding>
      <ListItemButton
        component={NavLink}
        to={to}
        end={end}
        sx={nestedItemSx}
      >
        <ListItemIcon sx={{ minWidth: 34 }}>
          <Icon sx={{ fontSize: 20 }} />
        </ListItemIcon>

        <ListItemText
          primary={label}
          primaryTypographyProps={{ fontSize: 13 }}
        />
      </ListItemButton>
    </ListItem>
  );

  const renderGroup = ({
    title,
    Icon,
    open,
    onToggle,
    active,
    children,
  }) => (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={onToggle} sx={groupSx(active)}>
          <ListItemIcon sx={{ minWidth: 38 }}>
            <Icon />
          </ListItemIcon>

          <ListItemText
            primary={title}
            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
          />

          {open ? (
            <ExpandMoreIcon sx={{ fontSize: 20, color: "#94A3B8" }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: 20, color: "#94A3B8" }} />
          )}
        </ListItemButton>
      </ListItem>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding sx={nestedListSx}>
          {children}
        </List>
      </Collapse>
    </>
  );

  // Локации: исходные пункты без назначения зон.
  const renderLocations = () =>
    renderGroup({
      title: "Локации",
      Icon: LocationOnOutlinedIcon,
      open: locationsOpen,
      onToggle: () => setLocationsOpen((prev) => !prev),
      active: isLocationsPage,
      children: (
        <>
          {renderNestedItem("/addresses", "Адреса", HomeWorkOutlinedIcon)}
          {renderNestedItem("/zones", "Зоны", MapOutlinedIcon, true)}
        </>
      ),
    });

  const renderEquipment = () =>
    renderGroup({
      title: "Оборудование",
      Icon: BuildOutlinedIcon,
      open: equipmentOpen,
      onToggle: () => setEquipmentOpen((prev) => !prev),
      active: isEquipmentPage,
      children: (
        <>
          {renderNestedItem(
            "/equipment/types",
            "Типы оборудования",
            CategoryOutlinedIcon
          )}

          {renderNestedItem(
            "/equipment",
            "Оборудование",
            Inventory2OutlinedIcon,
            true
          )}
        </>
      ),
    });

  // Администратор: назначение специализаций и зон находится
  // в одной существующей группе «Администрирование мастеров».
  const renderAdminSpecializations = () =>
    renderGroup({
      title: "Администрирование мастеров",
      Icon: EngineeringOutlinedIcon,
      open: specializationsOpen,
      onToggle: () => setSpecializationsOpen((prev) => !prev),
      active: isAdminMastersPage,
      children: (
        <>
          {renderNestedItem(
            "/specializations",
            "Справочник специализаций",
            EngineeringOutlinedIcon,
            true
          )}

          {renderNestedItem(
            "/specializations/assign",
            "Назначение специализации",
            AssignmentIndOutlinedIcon
          )}

          {renderNestedItem(
            "/zones/assign",
            "Назначение зон",
            MapOutlinedIcon
          )}
        </>
      ),
    });

  // Диспетчер: сохраняем исходную группу и её пункты.
  const renderDispatcherSpecializations = () =>
    renderGroup({
      title: "Управление мастерами",
      Icon: EngineeringOutlinedIcon,
      open: specializationsOpen,
      onToggle: () => setSpecializationsOpen((prev) => !prev),
      active: isSpecializationsPage || isDispatcherZonesPage,
      children: (
        <>
          {renderNestedItem(
            "/specializations/assign",
            "Назначение специализаций",
            AssignmentIndOutlinedIcon
          )}
          {renderNestedItem(
            "/zones/assign",
            "Назначение зон",
            MapOutlinedIcon
          )}
        </>
      ),
    });

  const renderAdminMenu = () => (
    <>
      <SectionTitle>ОБЩЕЕ</SectionTitle>
      {renderItem("/dashboard", "Главная", DashboardOutlinedIcon, true)}
      {renderItem("/profile", "Профиль", PersonOutlineOutlinedIcon)}

      <SectionTitle>РАБОТА</SectionTitle>
      {renderItem("/requests", "Все заявки", AssignmentOutlinedIcon)}

      <SectionTitle>АДМИНИСТРИРОВАНИЕ</SectionTitle>
      {renderItem("/users", "Пользователи", PeopleOutlineOutlinedIcon)}
      {renderLocations()}
      {renderEquipment()}
      {renderAdminSpecializations()}
    </>
  );

  const renderDispatcherMenu = () => (
    <>
      <SectionTitle>ОБЩЕЕ</SectionTitle>
      {renderItem("/dashboard", "Главная", DashboardOutlinedIcon, true)}
      {renderItem("/profile", "Профиль", PersonOutlineOutlinedIcon)}

      <SectionTitle>РАБОТА</SectionTitle>
      {renderItem("/requests", "Заявки", AssignmentOutlinedIcon)}
      {renderDispatcherSpecializations()}
    </>
  );

  const renderEngineerMenu = () => (
    <>
      <SectionTitle>ОБЩЕЕ</SectionTitle>
      {renderItem("/dashboard", "Главная", DashboardOutlinedIcon, true)}
      {renderItem("/profile", "Профиль", PersonOutlineOutlinedIcon)}

      <SectionTitle>РАБОТА</SectionTitle>
      {renderItem("/requests", "Мои заявки", AssignmentOutlinedIcon)}
    </>
  );

  const renderClientMenu = () => (
    <>
      <SectionTitle>ОБЩЕЕ</SectionTitle>
      {renderItem("/dashboard", "Главная", DashboardOutlinedIcon, true)}
      {renderItem("/profile", "Профиль", PersonOutlineOutlinedIcon)}

      <SectionTitle>РАБОТА</SectionTitle>
      {renderItem("/my-requests", "Мои заявки", AssignmentOutlinedIcon)}
      {renderItem("/my-equipment", "Моё оборудование", BuildOutlinedIcon)}
    </>
  );

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
        "&::-webkit-scrollbar": { width: 5 },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(255,255,255,.2)",
          borderRadius: 10,
        },
      }}
    >
      <Box
        sx={{
          height: 72,
          px: 2.5,
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EngineeringOutlinedIcon />
          </Box>

          <Box>
            <Typography
              sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}
            >
              Service
            </Typography>

            <Typography
              sx={{ fontSize: 11, color: "#BFDBFE", lineHeight: 1.1 }}
            >
              Company
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,.12)" }} />

      <Box sx={{ px: 1.2, py: 2, flex: 1 }}>
        {role === "ADMIN" && renderAdminMenu()}
        {role === "DISPATCHER" && renderDispatcherMenu()}
        {role === "ENGINEER" && renderEngineerMenu()}
        {role === "CLIENT" && renderClientMenu()}
      </Box>
    </Box>
  );
}

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
