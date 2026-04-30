import { apiClient, unwrap } from "./client";

export const updateProfileApi = async (payload) => unwrap(await apiClient.patch("/users/me", payload));
export const fetchUsersApi = async (params = {}) => unwrap(await apiClient.get("/users", { params }));
