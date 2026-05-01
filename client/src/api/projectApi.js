import { apiClient, unwrap } from "./client";

export const fetchTeamsApi = async () => unwrap(await apiClient.get("/teams"));
export const fetchTeamApi = async (teamId) => unwrap(await apiClient.get(`/teams/${teamId}`));
export const createTeamApi = async (payload) => unwrap(await apiClient.post("/teams", payload));
export const inviteTeamMemberApi = async ({ teamId, payload }) => unwrap(await apiClient.post(`/teams/${teamId}/invite`, payload));
export const acceptTeamInvitationApi = async ({ teamId, userId }) =>
  unwrap(await apiClient.post(`/teams/${teamId}/invitations/${userId}/accept`));
export const declineTeamInvitationApi = async ({ teamId, userId }) =>
  unwrap(await apiClient.post(`/teams/${teamId}/invitations/${userId}/decline`));
export const updateTeamMemberRoleApi = async ({ teamId, memberUserId, role }) =>
  unwrap(await apiClient.patch(`/teams/${teamId}/members/${memberUserId}/role`, { role }));
export const fetchProjectsApi = async (teamId) => unwrap(await apiClient.get("/projects", { params: { teamId } }));
export const createProjectApi = async (payload) => unwrap(await apiClient.post("/projects", payload));
export const fetchProjectApi = async (projectId) => unwrap(await apiClient.get(`/projects/${projectId}`));
export const addProjectMemberApi = async ({ projectId, userId, role, memberLabel = "" }) =>
  unwrap(await apiClient.post(`/projects/${projectId}/members`, { userId, role, memberLabel }));
export const updateProjectMemberLabelApi = async ({ projectId, memberUserId, memberLabel }) =>
  unwrap(await apiClient.patch(`/projects/${projectId}/members/${memberUserId}/label`, { memberLabel }));
export const fetchProjectSprintsApi = async (projectId) => unwrap(await apiClient.get(`/projects/${projectId}/sprints`));
export const createSprintApi = async ({ projectId, payload }) =>
  unwrap(await apiClient.post(`/projects/${projectId}/sprints`, payload));
export const startSprintApi = async ({ projectId, sprintId }) =>
  unwrap(await apiClient.patch(`/projects/${projectId}/sprints/${sprintId}/start`));
export const closeSprintApi = async ({ projectId, sprintId }) =>
  unwrap(await apiClient.patch(`/projects/${projectId}/sprints/${sprintId}/close`));
export const fetchSprintBurndownApi = async ({ projectId, sprintId }) =>
  unwrap(await apiClient.get(`/projects/${projectId}/sprints/${sprintId}/burndown`));
export const fetchProjectOverviewApi = async (projectId) => unwrap(await apiClient.get(`/projects/${projectId}/overview`));
