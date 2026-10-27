const API_URL = (
    import.meta.env.VITE_REQUEST_API_URL ||
    "http://localhost:8084/api"
).replace(/\/+$/, "");

async function requestApi(path, options = {}) {
    let response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            ...options,
            credentials: "include",
            headers: {
                ...(options.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...options.headers,
            },
        });
    } catch (error) {
        const networkError = new Error(
            "Не удалось связаться с сервером. Проверьте подключение."
        );

        networkError.isNetworkError = true;
        throw networkError;
    }

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
            // Ответ может быть без тела или не в формате JSON.
        }

        const apiError = new Error(message);
        apiError.status = response.status;

        throw apiError;
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
 * Получение всех заявок для администратора и диспетчера.
 */
export async function getAllRequests() {
    const result = await requestApi("/requests/all");

    if (Array.isArray(result)) {
        return result;
    }

    return result?.content ?? result?.requests ?? result?.data ?? [];
}

/**
 * Получение одной заявки.
 * Используется клиентом, администратором и диспетчером.
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
 * Отмена заявки клиентом до её принятия.
 */
export function cancelRequest(id) {
    return requestApi(`/requests/${encodeURIComponent(id)}/cancel`, {
        method: "POST",
    });
}

/**
 * Получение кандидатов на назначение мастера.
 */
export function getAssignmentCandidates(requestId) {
    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/assignment-candidates`
    );
}

/**
 * Назначение или переназначение мастера.
 */
export function assignMaster(requestId, masterId) {
    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/assign`,
        {
            method: "POST",
            body: JSON.stringify({ masterId }),
        }
    );
}

/**
 * Отмена заявки администратором или диспетчером.
 */
export function adminCancelRequest(requestId) {
    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/admin-cancel`,
        {
            method: "POST",
        }
    );
}

/**
 * Получение заявок текущего мастера.
 * GET /api/requests/master
 */
export async function getMasterRequests() {
    const result = await requestApi("/requests/master");

    if (Array.isArray(result)) {
        return result;
    }

    return result?.content ?? result?.requests ?? result?.data ?? [];
}

/**
 * Принятие заявки мастером.
 * ASSIGNED -> IN_PROGRESS
 */
export function acceptMasterRequest(requestId) {
    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/master-accept`,
        {
            method: "POST",
        }
    );
}

/**
 * Отклонение назначения мастером.
 * ASSIGNED -> WAITING_FOR_ASSIGNMENT
 */
export function rejectMasterRequest(requestId) {
    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/master-reject`,
        {
            method: "POST",
        }
    );
}