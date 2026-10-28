
const API_URL = (
    import.meta.env.VITE_REQUEST_API_URL ||
    "http://localhost:8084/api"
).replace(/\/+$/, "");

async function requestApi(path, options = {}) {
    let response;

    try {
        const headers = { ...options.headers };

        if (options.body && !(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        response = await fetch(`${API_URL}${path}`, {
            ...options,
            credentials: "include",
            headers,
        });
    } catch {
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
            // Ответ может быть пустым или не в формате JSON.
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
 * Отмена заявки клиентом.
 */
export function cancelRequest(id) {
    return requestApi(
        `/requests/${encodeURIComponent(id)}/cancel`,
        { method: "POST" }
    );
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
        { method: "POST" }
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
 */
export function acceptMasterRequest(requestId) {
    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/master-accept`,
        { method: "POST" }
    );
}

/**
 * Отклонение назначения мастером.
 */
export function rejectMasterRequest(requestId) {
    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/master-reject`,
        { method: "POST" }
    );
}

/**
 * Получение отчёта мастера.
 * GET /api/requests/{requestId}/report
 */
export function getWorkReport(requestId) {
    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/report`
    );
}

/**
 * Сохранение черновика отчёта.
 * PUT /api/requests/{requestId}/report
 */
export function saveWorkReportDraft(requestId, data) {
    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/report`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        }
    );
}

/**
 * Загрузка вложения отчёта.
 * POST /api/requests/{requestId}/report/attachments
 * Multipart-поле: file
 */
export function uploadWorkReportAttachment(requestId, file) {
    const formData = new FormData();
    formData.append("file", file);

    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/report/attachments`,
        {
            method: "POST",
            body: formData,
        }
    );
}

/**
 * Отправка отчёта.
 * POST /api/requests/{requestId}/report/submit
 */
export function submitWorkReport(requestId) {
    return requestApi(
        `/requests/${encodeURIComponent(requestId)}/report/submit`,
        { method: "POST" }
    );
}

/**
 * Скачивание вложения с использованием HttpOnly cookie.
 */

/**
 * Скачивание вложения отчёта.
 * GET /api/requests/{requestId}/report/attachments/{attachmentId}
 *
 * Возвращает { blob, filename }.
 * Скачивание выполняет компонент WorkReportViewer.
 */
export async function downloadWorkReportAttachment(
    requestId,
    attachmentId,
    fileName
) {
    const response = await fetch(
        `${API_URL}/requests/${encodeURIComponent(requestId)}` +
        `/report/attachments/${encodeURIComponent(attachmentId)}`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (!response.ok) {
        let message = `Не удалось скачать файл: ${response.status}`;

        try {
            const error = await response.json();
            message =
                error.message ||
                error.detail ||
                error.error ||
                message;
        } catch {
            // Ответ сервера может быть не в формате JSON.
        }

        const apiError = new Error(message);
        apiError.status = response.status;
        throw apiError;
    }

    const blob = await response.blob();

    if (!blob || blob.size === 0) {
        throw new Error("Сервер вернул пустой файл.");
    }

    const disposition =
        response.headers.get("content-disposition") || "";

    const encodedFilename = disposition.match(
        /filename\*=UTF-8''([^;]+)/i
    );

    const regularFilename = disposition.match(
        /filename="?([^";]+)"?/i
    );

    let filename = fileName || "";

    if (!filename && encodedFilename?.[1]) {
        try {
            filename = decodeURIComponent(encodedFilename[1]);
        } catch {
            filename = encodedFilename[1];
        }
    }

    if (!filename) {
        filename = regularFilename?.[1] || `attachment-${attachmentId}`;
    }

    filename = filename.replace(/[\\/:*?"<>|]/g, "_");

    return {
        blob,
        filename,
    };
}

