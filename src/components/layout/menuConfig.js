import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BuildIcon from "@mui/icons-material/Build";
import GroupIcon from "@mui/icons-material/Group";
import EngineeringIcon from "@mui/icons-material/Engineering";
import MapIcon from "@mui/icons-material/Map";
import LocationCityIcon from "@mui/icons-material/LocationCity";

export const MENU = {
  CLIENT: [
    {
      title: "Главная",
      icon: DashboardIcon,
      path: "/dashboard",
    },
    {
      title: "Профиль",
      icon: PersonIcon,
      path: "/profile",
    },
    {
      title: "Моё оборудование",
      icon: BuildIcon,
      path: "/equipment",
    },
    {
      title: "Мои заявки",
      icon: AssignmentIcon,
      path: "/requests",
    },
  ],

  ADMIN: [
    {
      title: "Главная",
      icon: DashboardIcon,
      path: "/dashboard",
    },
    {
      title: "Профиль",
      icon: PersonIcon,
      path: "/profile",
    },
    {
      title: "Все заявки",
      icon: AssignmentIcon,
      path: "/requests",
    },
    {
      title: "Пользователи",
      icon: GroupIcon,
      path: "/users",
    },
    {
      title: "Мастера",
      icon: EngineeringIcon,
      path: "/masters",
    },
    {
      title: "Зоны",
      icon: MapIcon,
      path: "/zones",
    },
    {
      title: "Адреса",
      icon: LocationCityIcon,
      path: "/addresses",
    },
  ],
};