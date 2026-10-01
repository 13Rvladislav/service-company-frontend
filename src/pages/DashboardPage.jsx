import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material";

import MainLayout from "../components/layout/MainLayout";
import { getCurrentProfile } from "../api/userApi";

function DashboardPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getCurrentProfile();
        setUser(profile);
      } catch (error) {
        console.error(error);
        navigate("/", { replace: true });
      }
    };

    loadProfile();
  }, [navigate]);

  if (!user) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#F4F7FB",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const stats = [
    { title: "Активные заявки", value: 18 },
    { title: "В работе", value: 7 },
    { title: "Завершено", value: 143 },
    { title: "Мастеров", value: 12 },
  ];

  return (
    <MainLayout user={user}>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="primary"
          gutterBottom
        >
          Панель управления
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Добро пожаловать, {user.firstName}! Рады видеть вас в системе.
        </Typography>

        {/* Карточки статистики */}
        <Grid container spacing={3}>
          {stats.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 3,
                  height: "100%",
                }}
              >
                <CardContent>
                  <Typography color="text.secondary" fontSize={14}>
                    {item.title}
                  </Typography>

                  <Typography
                    variant="h3"
                    color="primary"
                    fontWeight="bold"
                    sx={{ mt: 1 }}
                  >
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Нижний блок */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ borderRadius: 3, minHeight: 320 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Последние заявки
                </Typography>

                <Typography color="text.secondary">
                  Здесь будет таблица заявок из request-service.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ borderRadius: 3, minHeight: 320 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Профиль
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography color="text.secondary">ФИО</Typography>
                  <Typography fontWeight="bold">
                    {user.lastName} {user.firstName} {user.middleName}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography color="text.secondary">Роль</Typography>
                  <Typography fontWeight="bold">
                    {user.role}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography color="text.secondary">Email</Typography>
                  <Typography>
                    {user.email}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography color="text.secondary">Телефон</Typography>
                  <Typography>
                    {user.phone}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
}

export default DashboardPage;