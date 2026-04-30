import { apiClient, unwrap } from "./client";

export const fetchNotificationsApi = async () => unwrap(await apiClient.get("/notifications"));
export const markNotificationReadApi = async (notificationId) => unwrap(await apiClient.patch(`/notifications/${notificationId}/read`));
export const markAllNotificationsReadApi = async () => unwrap(await apiClient.patch("/notifications/read-all"));
