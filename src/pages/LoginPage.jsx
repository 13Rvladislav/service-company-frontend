import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Link,
  TextField,
  Typography,
} from "@mui/material";

import { login } from "../api/authApi";

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(form);

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Неверный email или пароль"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#EEF4FF 0%,#F8FAFC 100%)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={8} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              variant="h2"
              color="primary"
              fontWeight="bold"
              gutterBottom
            >
              Service Company
            </Typography>

            <Typography variant="h4" sx={{ mb: 3 }}>
              Информационная система сервисной компании
            </Typography>

            <Typography
              color="text.secondary"
              lineHeight={1.8}
              fontSize="18px"
            >
              Управление заявками, мастерами, диспетчерами, адресами
              обслуживания и полным жизненным циклом ремонта газового
              оборудования.
            </Typography>

            <Box sx={{ mt: 5, display: "flex", gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "white",
                  boxShadow: 1,
                  minWidth: 140,
                }}
              >
                <Typography
                  variant="h4"
                  color="primary"
                  fontWeight="bold"
                >
                  24/7
                </Typography>

                <Typography variant="body2">
                  Работа системы
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "white",
                  boxShadow: 1,
                  minWidth: 140,
                }}
              >
                <Typography
                  variant="h4"
                  color="primary"
                  fontWeight="bold"
                >
                  4
                </Typography>

                <Typography variant="body2">
                  Роли пользователей
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={10}
              sx={{
                borderRadius: 5,
                bgcolor: "rgba(255,255,255,.92)",
                backdropFilter: "blur(12px)",
              }}
            >
              <CardContent sx={{ p: 5 }}>
                <Typography
                  variant="h4"
                  align="center"
                  fontWeight="bold"
                  gutterBottom
                >
                  Вход в систему
                </Typography>

                <Typography
                  align="center"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Авторизуйтесь для продолжения работы
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    margin="normal"
                    value={form.email}
                    onChange={handleChange}
                  />

                  <TextField
                    fullWidth
                    label="Пароль"
                    name="password"
                    type="password"
                    margin="normal"
                    value={form.password}
                    onChange={handleChange}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      mt: 1,
                    }}
                  >
                    <Link
                      component={RouterLink}
                      to="/forgot-password"
                      underline="hover"
                    >
                      Забыли пароль?
                    </Link>
                  </Box>

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      mt: 3,
                      py: 1.6,
                      borderRadius: 3,
                      fontWeight: "bold",
                    }}
                  >
                    {loading ? "Вход..." : "Войти"}
                  </Button>

                  <Button
                    component={RouterLink}
                    to="/register"
                    fullWidth
                    variant="outlined"
                    size="large"
                    sx={{
                      mt: 2,
                      py: 1.6,
                      borderRadius: 3,
                      fontWeight: "bold",
                    }}
                  >
                    Регистрация
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default LoginPage;