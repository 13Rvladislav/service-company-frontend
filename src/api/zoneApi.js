import api from "./axios";

// Получить все зоны
export const getAllZones = async () => {
  const { data } = await api.get("/zones");
  return data;
};

// Создать зону
export const createZone = async (zone) => {
  const { data } = await api.post("/zones", {
    name: zone.name,
    description: zone.description,
  });

  return data;
};

// Обновить зону
export const updateZone = async (id, zone) => {
  const { data } = await api.put(`/zones/${id}`, {
    name: zone.name,
    description: zone.description,
  });

  return data;
};

// Удалить зону
export const deleteZone = async (id) => {
  const { data } = await api.delete(`/zones/${id}`);
  return data;
};