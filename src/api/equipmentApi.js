import axios from "axios";

const EQUIPMENT_API_URL = "http://localhost:8083/api/equipment";

const apiConfig = {
  withCredentials: true,
};

/* ========================================================= */
/* ТИПЫ ОБОРУДОВАНИЯ                                        */
/* ========================================================= */

export const getEquipmentTypes = async () => {
  const { data } = await axios.get(
    `${EQUIPMENT_API_URL}/types`,
    apiConfig
  );

  return data;
};

export const getEquipmentType = async (id) => {
  const { data } = await axios.get(
    `${EQUIPMENT_API_URL}/types/${id}`,
    apiConfig
  );

  return data;
};

export const createEquipmentType = async (payload) => {
  const { data } = await axios.post(
    `${EQUIPMENT_API_URL}/types`,
    payload,
    apiConfig
  );

  return data;
};

export const updateEquipmentType = async (
  id,
  payload
) => {
  const { data } = await axios.put(
    `${EQUIPMENT_API_URL}/types/${id}`,
    payload,
    apiConfig
  );

  return data;
};

export const deleteEquipmentType = async (id) => {
  await axios.delete(
    `${EQUIPMENT_API_URL}/types/${id}`,
    apiConfig
  );
};

/* ========================================================= */
/* КАТАЛОГ ОБОРУДОВАНИЯ                                     */
/* ========================================================= */

export const getEquipmentCatalog = async () => {
  const { data } = await axios.get(
    `${EQUIPMENT_API_URL}/catalog`,
    apiConfig
  );

  return data;
};

export const getEquipmentCatalogItem = async (id) => {
  const { data } = await axios.get(
    `${EQUIPMENT_API_URL}/catalog/${id}`,
    apiConfig
  );

  return data;
};

export const createEquipmentCatalogItem = async (
  payload
) => {
  const { data } = await axios.post(
    `${EQUIPMENT_API_URL}/catalog`,
    payload,
    apiConfig
  );

  return data;
};

export const updateEquipmentCatalogItem = async (
  id,
  payload
) => {
  const { data } = await axios.put(
    `${EQUIPMENT_API_URL}/catalog/${id}`,
    payload,
    apiConfig
  );

  return data;
};

export const deleteEquipmentCatalogItem = async (
  id
) => {
  await axios.delete(
    `${EQUIPMENT_API_URL}/catalog/${id}`,
    apiConfig
  );
};