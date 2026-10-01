import api from "./axios";

/* ---------- GET ---------- */

export const getAllCities = async () => {
    const { data } = await api.get("/address/cities");
    return data;
};

export const getStreetsByCity = async (cityId) => {
    const { data } = await api.get(`/address/cities/${cityId}/streets`);
    return data;
};

export const getHousesByStreet = async (streetId) => {
    const { data } = await api.get(`/address/streets/${streetId}/houses`);
    return data;
};

/* ---------- CREATE ---------- */

export const createCity = async (name) => {
    const { data } = await api.post("/address/cities", { name });
    return data;
};

export const createStreet = async (payload) => {
    const { data } = await api.post("/address/streets", payload);
    return data;
};

export const createHouse = async (payload) => {
    const { data } = await api.post("/address/houses", payload);
    return data;
};

/* ---------- UPDATE ---------- */

export const updateCity = async (id, name) => {
    const { data } = await api.put(`/address/cities/${id}`, { name });
    return data;
};

export const updateStreet = async (id, payload) => {
    const { data } = await api.put(`/address/streets/${id}`, payload);
    return data;
};

export const updateHouse = async (id, number) => {
    const { data } = await api.put(`/address/houses/${id}`, {
        number,
    });

    return data;
};
/* ---------- DELETE ---------- */

export const deleteCity = async (id) => {
    const { data } = await api.delete(`/address/cities/${id}`);
    return data;
};

export const deleteStreet = async (id) => {
    const { data } = await api.delete(`/address/streets/${id}`);
    return data;
};

export const deleteHouse = async (id) => {
    const { data } = await api.delete(`/address/houses/${id}`);
    return data;
};