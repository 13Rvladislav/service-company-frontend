import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Link,
    TextField,
    Typography
} from "@mui/material";

import { forgotPassword } from "../api/authApi";

function ForgotPasswordPage() {

    const [email, setEmail] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {

        event.preventDefault();

        try {

            await forgotPassword(email);

            setSuccess("Инструкция отправлена на Email.");
            setError("");

        } catch (err) {

            setError(
                err.response?.data?.message || "Ошибка восстановления"
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
            <Container maxWidth="sm">

                <Card elevation={8} sx={{ borderRadius: 5 }}>
                    <CardContent sx={{ p: 5 }}>

                        <Typography
                            variant="h4"
                            align="center"
                            fontWeight="bold"
                            color="primary"
                            gutterBottom
                        >
                            Забыли пароль?
                        </Typography>

                        <Typography
                            align="center"
                            color="text.secondary"
                            sx={{ mb: 3 }}
                        >
                            Введите Email, привязанный к аккаунту
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

                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={{ mb: 3 }}
                            />

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
                                Отправить
                            </Button>

                        </Box>

                        <Box sx={{ textAlign: "center", mt: 3 }}>

                            <Link
                                component={RouterLink}
                                to="/"
                                underline="hover"
                            >
                                Вернуться ко входу
                            </Link>

                        </Box>

                    </CardContent>
                </Card>

            </Container>
        </Box>
    );
}

export default ForgotPasswordPage;