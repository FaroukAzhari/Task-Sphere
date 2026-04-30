import { apiClient, unwrap } from "./client";

export const fetchAnalyticsApi = async (params) => unwrap(await apiClient.get("/analytics/dashboard", { params }));
