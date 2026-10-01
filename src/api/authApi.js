import axios from "axios";

const authApi = axios.create({
  baseURL: "http://localhost:8081/api/auth",
  withCredentials: true,
});

export const login = async (data) => {
  const response = await authApi.post("/login", data);
  return response.data;
};

export const register = async (data) => {
  const response = await authApi.post("/register", data);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await authApi.post("/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await authApi.post("/reset-password", data);
  return response.data;
};

export const logout = async () => {
  const response = await authApi.post("/logout");
  return response.data;
};

export default authApi;