
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { getCurrentProfile } from "../api/userApi";

function ProtectedRoute() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        await getCurrentProfile();

        if (active) {
          setStatus("authenticated");
          setError("");
        }
      } catch (err) {
        if (!active) return;

        const statusCode = err.response?.status;

        // Нет авторизации — отправляем на страницу входа.
        if (statusCode === 401) {
          setStatus("unauthenticated");
          return;
        }

        // Ошибка сервера, сети или доступа.
        // Не перенаправляем на страницу входа автоматически.
        setError(
          statusCode === 403
            ? "У вас недостаточно прав для доступа к профилю."
            : statusCode
              ? `Ошибка сервера профиля: ${statusCode}`
              : "Не удалось связаться с сервисом профиля. Проверьте, запущен ли user-service."
        );

        setStatus("error");
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/" replace />;
  }

  if (status === "error") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 3,
        }}
      >
        <Box sx={{ maxWidth: 500, width: "100%" }}>
          <Alert severity="error">{error}</Alert>

          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Повторить проверку
          </Button>
        </Box>
      </Box>
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
