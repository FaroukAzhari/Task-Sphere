import { apiClient, unwrap } from "./client";

export const loginApi = async (payload) => unwrap(await apiClient.post("/auth/login", payload));
export const registerApi = async (payload) => unwrap(await apiClient.post("/auth/register", payload));
export const meApi = async () => unwrap(await apiClient.get("/auth/me"));
