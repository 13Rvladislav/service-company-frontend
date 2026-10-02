import axios from "axios";

const AUTH_API_URL = "http://localhost:8081/api";

/**
 * Получить пользователей определённой роли.
 */
export const getUsersByRole = async (role) => {
    const { data } = await axios.get(
        `${AUTH_API_URL}/admin/users`,
        {
            params: {
                role,
            },
            withCredentials: true,
        }
    );

    return data;
};

/**
 * Получить полную карточку пользователя.
 */
export const getUserCard = async (id) => {
    const { data } = await axios.get(
        `${AUTH_API_URL}/admin/users/${id}`,
        {
            withCredentials: true,
        }
    );

    return data;
};

/**
 * Заблокировать / разблокировать пользователя.
 *
 * enabled = false -> блокировка
 * enabled = true  -> разблокировка
 */
export const setUserStatus = async (
    id,
    enabled
) => {
    const { data } = await axios.patch(
        `${AUTH_API_URL}/admin/users/${id}/status`,
        null,
        {
            params: {
                enabled,
            },
            withCredentials: true,
        }
    );

    return data;
};

/**
 * Создать клиента.
 */
export const createClient = async (payload) => {
    const { data } = await axios.post(
        `${AUTH_API_URL}/auth/register`,
        payload,
        {
            withCredentials: true,
        }
    );

    return data;
};

/**
 * Создать сотрудника.
 *
 * ENGINEER
 * DISPATCHER
 * ADMIN
 */
export const createEmployee = async (payload) => {
    const { data } = await axios.post(
        `${AUTH_API_URL}/admin/employees`,
        payload,
        {
            withCredentials: true,
        }
    );

    return data;
};

//Удаление учеток
export const deleteUser = async (id) => {
    await axios.delete(
        `${AUTH_API_URL}/admin/users/${id}`,
        {
            withCredentials: true,
        }
    );
};