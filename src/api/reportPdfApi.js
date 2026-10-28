const API_URL = (import.meta.env.VITE_REQUEST_API_URL || "http://localhost:8084/api")
    .replace(/\/$/, "");

function getFilename(contentDisposition, fallback) {
    if (!contentDisposition) return fallback;

    const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

    if (encoded?.[1]) {
        try {
            return decodeURIComponent(encoded[1].replace(/["']/g, ""));
        } catch {
            // Используем обычное имя файла ниже.
        }
    }

    const plain = contentDisposition.match(/filename="?([^";]+)"?/i);
    return plain?.[1] || fallback;
}

export async function downloadWorkReportPdf(requestId) {
    const response = await fetch(
        `${API_URL}/requests/${encodeURIComponent(requestId)}/report/pdf`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/pdf",
            },
        }
    );

    if (!response.ok) {
        let message = "Не удалось скачать PDF-отчёт.";

        try {
            const body = await response.json();
            message = body?.message || body?.error || message;
        } catch {
            // Сервер мог вернуть не JSON.
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    const blob = await response.blob();
    const filename = getFilename(
        response.headers.get("Content-Disposition"),
        `request-report-${requestId}.pdf`
    );

    return { blob, filename };
}