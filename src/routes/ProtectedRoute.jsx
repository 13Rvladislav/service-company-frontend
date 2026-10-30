
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Typography,
} from "@mui/material";

import { getCurrentProfile } from "../api/userApi";

function ProtectedRoute({ allowedRoles }) {
    const [status, setStatus] = useState("loading");
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function checkAuth() {
            try {
                const response = await getCurrentProfile();

                // Поддерживаем как возвращаемый объект профиля,
                // так и Axios response с полем data.
                const currentProfile =
                    response?.data?.data ??
                    response?.data?.user ??
                    response?.data ??
                    response?.user ??
                    response;

                if (!active) return;

                setProfile(currentProfile);
                setStatus("authenticated");
                setError("");
            } catch (err) {
                if (!active) return;

                const statusCode = err.response?.status;

                if (statusCode === 401) {
                    setStatus("unauthenticated");
                    return;
                }

                setError(
                    statusCode === 403
                        ? "У вас недостаточно прав для доступа к профилю."
                        : statusCode
                            ? `Ошибка сервера профиля: ${statusCode}`
                            : "Не удалось связаться с user-service. Проверьте подключение."
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
                <Box sx={{ width: "100%", maxWidth: 500 }}>
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

    const role =
        profile?.role ??
        profile?.userRole ??
        profile?.user?.role ??
        profile?.data?.role;

    if (allowedRoles?.length && !allowedRoles.includes(role)) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 3,
                }}
            >
                <Box sx={{ maxWidth: 480, textAlign: "center" }}>
                    <Typography
                        sx={{
                            fontSize: "1.25rem",
                            fontWeight: 650,
                            mb: 1,
                        }}
                    >
                        Доступ запрещён
                    </Typography>

                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Эта страница доступна только администратору и диспетчеру.
                    </Typography>

                    <Button
                        variant="contained"
                        onClick={() => {
                            window.location.href = "/dashboard";
                        }}
                    >
                        На главную
                    </Button>
                </Box>
            </Box>
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;
