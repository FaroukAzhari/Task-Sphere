import { apiClient, unwrap } from "./client";

export const fetchTasksApi = async (params) => unwrap(await apiClient.get("/tasks", { params }));
export const fetchTaskApi = async (taskId) => unwrap(await apiClient.get(`/tasks/${taskId}`));
export const createTaskApi = async (payload) => unwrap(await apiClient.post("/tasks", payload));
export const updateTaskApi = async ({ taskId, payload }) => unwrap(await apiClient.patch(`/tasks/${taskId}`, payload));
export const moveTaskApi = async ({ taskId, status }) => unwrap(await apiClient.patch(`/tasks/${taskId}/move`, { status }));
export const addCommentApi = async ({ taskId, content }) => unwrap(await apiClient.post(`/tasks/${taskId}/comments`, { content }));
