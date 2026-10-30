
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_USER_API,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Добавляем Correlation ID и JWT к каждому запросу
api.interceptors.request.use(
  (config) => {
    // Correlation ID для связывания логов между микросервисами
    config.headers = config.headers || {};

    if (!config.headers["X-Correlation-Id"]) {
      config.headers["X-Correlation-Id"] = crypto.randomUUID();
    }

    // JWT из localStorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
