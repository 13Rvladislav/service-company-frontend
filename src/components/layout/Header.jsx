import {
  AppBar,
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { getAvatarUrl } from "../../api/userApi";

export default function Header({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const initials = `${user?.lastName?.[0] ?? ""}${user?.firstName?.[0] ?? ""}`;

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "#fff",
        color: "#1e293b",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" fontWeight={600}>
          Информационная система сервисной компании
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={user?.hasAvatar ? getAvatarUrl() : undefined}
            sx={{ width: 42, height: 42, bgcolor: "#2563eb" }}
          >
            {initials || "?"}
          </Avatar>

          <Box sx={{ textAlign: "right" }}>
            <Typography fontWeight={600}>
              {user
                ? `${user.lastName} ${user.firstName}`
                : "Пользователь"}
            </Typography>

            <Chip
              label={user?.role ?? "GUEST"}
              size="small"
              color="primary"
            />
          </Box>

          <IconButton color="error" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}