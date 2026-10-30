
const API_URL = (
    import.meta.env.VITE_REQUEST_API_URL ||
    `${import.meta.env.VITE_REQUEST_API || "http://localhost:8084"}/api`
).replace(/\/+$/, "");

export async function getAnalytics({
    from,
    to,
    zoneId,
    masterId,
} = {}) {
    const params = new URLSearchParams();

    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (zoneId) params.set("zoneId", zoneId);
    if (masterId) params.set("masterId", masterId);

    const query = params.toString();

    let response;

    try {
        response = await fetch(
            `${API_URL}/analytics${query ? `?${query}` : ""}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                },
            }
        );
    } catch {
        const error = new Error(
            "Не удалось связаться с сервером аналитики. Проверь доступность request-service."
        );
        error.isNetworkError = true;
        throw error;
    }

    if (!response.ok) {
        let message = `Ошибка загрузки аналитики: ${response.status}`;

        try {
            const error = await response.json();

            message =
                error.message ||
                error.detail ||
                error.error ||
                message;
        } catch {
            // Ответ может быть пустым.
        }

        const apiError = new Error(message);
        apiError.status = response.status;

        throw apiError;
    }

    return response.json();
}
