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
    Typography
} from "@mui/material";

import { register } from "../api/authApi";

function RegisterPage() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        lastName: "",
        firstName: "",
        middleName: "",
        email: "",
        phone: "",
        password: ""
    });

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {

        event.preventDefault();

        try {

            setError("");

            await register(form);

            setSuccess("Аккаунт успешно создан!");

            setTimeout(() => {
                navigate("/", { replace: true });
            }, 1200);

        } catch (err) {

            setError(
                err.response?.data?.message || "Ошибка регистрации"
            );

        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg,#EEF4FF 0%,#F8FAFC 100%)",
                display: "flex",
                alignItems: "center"
            }}
        >
            <Container maxWidth="md">

                <Card
                    elevation={8}
                    sx={{
                        borderRadius: 5,
                        bgcolor: "rgba(255,255,255,.94)"
                    }}
                >
                    <CardContent sx={{ p: 5 }}>

                        <Typography
                            variant="h3"
                            align="center"
                            color="primary"
                            fontWeight="bold"
                            gutterBottom
                        >
                            Регистрация
                        </Typography>

                        <Typography
                            align="center"
                            color="text.secondary"
                            sx={{ mb: 4 }}
                        >
                            Создание нового аккаунта клиента
                        </Typography>

                        {success && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                {success}
                            </Alert>
                        )}

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>

                            <Grid container spacing={2}>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Фамилия"
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Имя"
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Отчество"
                                        name="middleName"
                                        value={form.middleName}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Телефон"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Пароль"
                                        name="password"
                                        type="password"
                                        value={form.password}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            py: 1.6,
                                            borderRadius: 3,
                                            fontWeight: "bold"
                                        }}
                                    >
                                        Создать аккаунт
                                    </Button>
                                </Grid>

                            </Grid>

                        </Box>

                        <Box sx={{ textAlign: "center", mt: 3 }}>

                            <Link
                                component={RouterLink}
                                to="/"
                                underline="hover"
                            >
                                Уже есть аккаунт? Войти
                            </Link>

                        </Box>

                    </CardContent>
                </Card>

            </Container>
        </Box>
    );
}

export default RegisterPage;