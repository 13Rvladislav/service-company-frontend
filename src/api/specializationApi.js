import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8082",
  withCredentials: true,
});

// Получить все специализации.
export const getSpecializations = async () => {
  const { data } = await API.get("/api/specializations");
  return data;
};

// Получить специализацию по ID.
export const getSpecialization = async (id) => {
  const { data } = await API.get(`/api/specializations/${id}`);
  return data;
};

// Создать специализацию.
// payload: { name, equipmentTypeIds }
export const createSpecialization = async (payload) => {
  const { data } = await API.post("/api/specializations", payload);
  return data;
};

// Обновить специализацию.
// payload: { name, equipmentTypeIds }
export const updateSpecialization = async (id, payload) => {
  const { data } = await API.put(`/api/specializations/${id}`, payload);
  return data;
};

// Удалить специализацию.
export const deleteSpecialization = async (id) => {
  await API.delete(`/api/specializations/${id}`);
};

// Получить специализации по типу оборудования.
export const getSpecializationsByEquipmentType = async (equipmentTypeId) => {
  const { data } = await API.get(
    `/api/specializations/equipment-type/${equipmentTypeId}`
  );

  return data;
};

// Получить специализации конкретного мастера.
// masterId — это ID MasterProfile, не authUserId.
export const getMasterSpecializations = async (masterId) => {
  const { data } = await API.get(
    `/api/masters/${masterId}/specializations`
  );

  return data;
};

// Полностью заменить список специализаций мастера.
export const assignMasterSpecializations = async (
  masterId,
  specializationIds
) => {
  const { data } = await API.put(
    `/api/masters/${masterId}/specializations`,
    { specializationIds }
  );

  return data;
};

// Получить список мастеров.
// Этот адрес должен возвращать именно MasterProfile с полем id.
export const getMasters = async () => {
  const { data } = await API.get("/api/masters");
  return data;
};