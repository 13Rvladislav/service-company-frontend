const API_URL = (
    import.meta.env.VITE_REQUEST_API_URL ||
    "http://localhost:8084/api"
).replace(/\/+$/, "");

async function requestApi(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        let message = `Ошибка запроса: ${response.status}`;

        try {
            const error = await response.json();

            message =
                error.message ||
                error.detail ||
                error.error ||
                message;
        } catch {
            // Ответ сервера может быть без тела или не в формате JSON.
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
        return response.json();
    }

    return null;
}

/**
 * Данные для формы создания заявки:
 * профиль клиента, адрес и оборудование.
 */
export function getCreateRequestForm() {
    return requestApi("/requests/create-form");
}

/**
 * Получение заявок текущего клиента.
 */
export async function getMyRequests() {
    const result = await requestApi("/requests/my");

    if (Array.isArray(result)) {
        return result;
    }

    return result?.content ?? result?.requests ?? result?.data ?? [];
}

/**
 * Получение одной заявки.
 */
export function getRequestById(id) {
    return requestApi(`/requests/${encodeURIComponent(id)}`);
}

/**
 * Создание заявки.
 */
export function createRequest(data) {
    return requestApi("/requests", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/**
 * Редактирование заявки до её принятия.
 */
export function updateRequest(id, data) {
    return requestApi(`/requests/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

/**
 * Отмена заявки до её принятия.
 */
export function cancelRequest(id) {
    return requestApi(`/requests/${encodeURIComponent(id)}/cancel`, {
        method: "POST",
    });
}