import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8082",
  withCredentials: true,
});

export const getCurrentProfile = async () => {
  const { data } = await API.get("/api/profile/me");
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await API.put("/api/profile/me", payload);
  return data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await API.post("/api/profile/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

export const getAvatarUrl = () => {
  return "http://localhost:8082/api/profile/me/avatar";
};