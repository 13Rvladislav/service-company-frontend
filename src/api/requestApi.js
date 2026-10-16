
import axios from "axios";

const requestApi = axios.create({
    baseURL: "http://localhost:8084",
    withCredentials: true,
});

export const getMyRequests = async () => {
    const { data } = await requestApi.get("/api/requests/my");
    return data;
};

export const createRequest = async (request) => {
    const { data } = await requestApi.post("/api/requests", request);
    return data;
};

export default requestApi;
