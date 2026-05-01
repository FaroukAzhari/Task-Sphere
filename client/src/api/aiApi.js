import { apiClient, unwrap } from "./client";

export const chatWithFonAiApi = async ({ message, history = [] }) =>
  unwrap(await apiClient.post("/ai/chat", { message, history }));
