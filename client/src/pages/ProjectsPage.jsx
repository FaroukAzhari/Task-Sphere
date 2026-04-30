import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import {
  addProjectMemberApi,
  createProjectApi,
  createTeamApi,
  fetchProjectApi,
  fetchProjectsApi,
  fetchTeamApi,
  fetchTeamsApi,
  inviteTeamMemberApi,
  updateProjectMemberLabelApi,
  updateTeamMemberRoleApi,
} from "../api/projectApi";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import Toast from "../components/common/Toast";

const teamRoles = ["Project Manager", "Team Lead", "Member", "Viewer"];
const roleRank = {
  Admin: 4,
  "Project Manager": 3,
  "Team Lead": 2.5,
  Member: 2,
  Viewer: 1,
};

const ProjectsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [toast, setToast] = useState({ type: "info", message: "" });
  const [inviteForm, setInviteForm] = useState({ email: "", role: "Member" });
  const [projectMemberForm, setProjectMemberForm] = useState({ userId: "", role: "Member", memberLabel: "" });
  const [teamForm, setTeamForm] = useState({ name: "", description: "" });
  const [projectForm, setProjectForm] = useState({ name: "", description: "", deadline: "" });

  const teamsQuery = useQuery({ queryKey: ["teams"], queryFn: fetchTeamsApi });
  const selectedTeamQuery = useQuery({
    queryKey: ["team", selectedTeam],
    queryFn: () => fetchTeamApi(selectedTeam),
    enabled: Boolean(selectedTeam),
  });
  const projectsQuery = useQuery({
    queryKey: ["projects", selectedTeam],
    queryFn: () => fetchProjectsApi(selectedTeam),
    enabled: Boolean(selectedTeam),
  });
  const selectedProjectQuery = useQuery({
    queryKey: ["project", selectedProject],
    queryFn: () => fetchProjectApi(selectedProject),
    enabled: Boolean(selectedProject),
  });

  const createTeamMutation = useMutation({
    mutationFn: createTeamApi,
    onSuccess: async () => {
      setTeamForm({ name: "", description: "" });
      setToast({ type: "success", message: "Team created." });
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (error) => setToast({ type: "error", message: error?.response?.data?.message || "Could not create team." }),
  });

  const createProjectMutation = useMutation({
    mutationFn: createProjectApi,
    onSuccess: async () => {
      setProjectForm({ name: "", description: "", deadline: "" });
      setToast({ type: "success", message: "Project created." });
      await queryClient.invalidateQueries({ queryKey: ["projects", selectedTeam] });
    },
    onError: (error) => setToast({ type: "error", message: error?.response?.data?.message || "Could not create project." }),
  });

  const inviteMemberMutation = useMutation({
    mutationFn: inviteTeamMemberApi,
    onSuccess: async () => {
      setInviteForm({ email: "", role: "Member" });
      setToast({ type: "success", message: "Team member added." });
      await queryClient.invalidateQueries({ queryKey: ["team", selectedTeam] });
      await queryClient.invalidateQueries({ queryKey: ["projects", selectedTeam] });
    },
    onError: (error) => setToast({ type: "error", message: error?.response?.data?.message || "Could not invite member." }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateTeamMemberRoleApi,
    onSuccess: async () => {
      setToast({ type: "success", message: "Member role updated." });
      await queryClient.invalidateQueries({ queryKey: ["team", selectedTeam] });
      await queryClient.invalidateQueries({ queryKey: ["projects", selectedTeam] });
    },
    onError: (error) => setToast({ type: "error", message: error?.response?.data?.message || "Could not update role." }),
  });

  const addProjectMemberMutation = useMutation({
    mutationFn: addProjectMemberApi,
    onSuccess: async () => {
      setToast({ type: "success", message: "Member added to project." });
      await queryClient.invalidateQueries({ queryKey: ["projects", selectedTeam] });
      if (selectedProject) {
        await queryClient.invalidateQueries({ queryKey: ["project", selectedProject] });
      }
    },
    onError: (error) => setToast({ type: "error", message: error?.response?.data?.message || "Could not add to project." }),
  });

  const updateProjectMemberLabelMutation = useMutation({
    mutationFn: updateProjectMemberLabelApi,
    onSuccess: async () => {
      setToast({ type: "success", message: "Member label updated." });
      await queryClient.invalidateQueries({ queryKey: ["project", selectedProject] });
    },
    onError: (error) => setToast({ type: "error", message: error?.response?.data?.message || "Could not update member label." }),
  });

  const teams = teamsQuery.data || [];
  const projects = projectsQuery.data || [];
  const teamMembers = selectedTeamQuery.data?.members || [];

  useEffect(() => {
    if (!selectedTeam && teams.length > 0) setSelectedTeam(teams[0]._id);
  }, [teams, selectedTeam]);

  useEffect(() => {
    if (projects.length > 0) setSelectedProject((prev) => prev || projects[0]._id);
    else setSelectedProject("");
  }, [projects]);

  const selectedProjectData = useMemo(() => projects.find((project) => project._id === selectedProject), [projects, selectedProject]);
  const todayISO = useMemo(() => new Date().toISOString().split("T")[0], []);

  if (teamsQuery.isLoading) return <LoadingState label="Loading teams" />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="text-lg font-semibold">Create team</h2>
          <div className="mt-3 grid gap-2">
            <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Team name" value={teamForm.name} onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))} />
            <textarea className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Description" value={teamForm.description} onChange={(e) => setTeamForm((prev) => ({ ...prev, description: e.target.value }))} />
            <button type="button" onClick={() => createTeamMutation.mutate(teamForm)} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Create team</button>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="text-lg font-semibold">Create project</h2>
          <div className="mt-3 grid gap-2">
            <select className="rounded-xl border border-slate-300 px-3 py-2" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
              {teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}
            </select>
            <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Project name" value={projectForm.name} onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))} />
            <textarea className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Description" value={projectForm.description} onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))} />
            <input className="rounded-xl border border-slate-300 px-3 py-2" type="date" min={todayISO} value={projectForm.deadline} onChange={(e) => setProjectForm((prev) => ({ ...prev, deadline: e.target.value }))} />
            <button
              type="button"
              onClick={() => {
                if (projectForm.deadline && projectForm.deadline < todayISO) {
                  setToast({ type: "error", message: "Project deadline cannot be earlier than today." });
                  return;
                }
                createProjectMutation.mutate({ ...projectForm, teamId: selectedTeam });
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Create project
            </button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Team member management</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{teamMembers.length} members</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Only one <strong>Team Lead</strong> is allowed per team.</p>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Invite by email" value={inviteForm.email} onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))} />
            <select className="rounded-xl border border-slate-300 px-3 py-2" value={inviteForm.role} onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value }))}>
              {teamRoles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </div>
          <button type="button" className="mt-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => inviteMemberMutation.mutate({ teamId: selectedTeam, payload: inviteForm })} disabled={!selectedTeam}>Add to team</button>

          <div className="mt-4 space-y-2">
            {teamMembers.map((member) => (
              <div key={member.user?._id || member.user} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {member.user?.avatarUrl ? (
                      <img src={member.user.avatarUrl} alt="member avatar" className="h-8 w-8 rounded-full border border-slate-300 object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[11px] font-semibold text-slate-700">
                        {(member.user?.name || "U").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{member.user?.name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{member.user?.email || "No email"}</p>
                    </div>
                  </div>
                  <select className="rounded-lg border border-slate-300 px-2 py-1 text-xs" value={member.role} onChange={(e) => updateRoleMutation.mutate({ teamId: selectedTeam, memberUserId: member.user?._id || member.user, role: e.target.value })}>
                    {["Admin", "Project Manager", "Team Lead", "Member", "Viewer"].map((role) => {
                      const isSelf = String(member.user?._id || member.user) === String(user?._id);
                      const blockedSelfDemotion = isSelf && (roleRank[role] || 0) < (roleRank[member.role] || 0);
                      return (
                        <option key={role} disabled={blockedSelfDemotion}>
                          {role}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            ))}
            {teamMembers.length === 0 && <p className="text-sm text-slate-500">No members yet.</p>}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="text-lg font-semibold">Add team member to project</h2>
          <div className="mt-3 grid gap-2">
            <select className="rounded-xl border border-slate-300 px-3 py-2" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
              <option value="">Select project</option>
              {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
            </select>
            <select className="rounded-xl border border-slate-300 px-3 py-2" value={projectMemberForm.userId} onChange={(e) => setProjectMemberForm((prev) => ({ ...prev, userId: e.target.value }))}>
              <option value="">Select team member</option>
              {teamMembers.map((member) => <option key={member.user?._id || member.user} value={member.user?._id || member.user}>{member.user?.name || member.user}</option>)}
            </select>
            <select className="rounded-xl border border-slate-300 px-3 py-2" value={projectMemberForm.role} onChange={(e) => setProjectMemberForm((prev) => ({ ...prev, role: e.target.value }))}>
              {teamRoles.map((role) => <option key={role}>{role}</option>)}
            </select>
            <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Member label (e.g. Backend, QA, UI)" value={projectMemberForm.memberLabel} onChange={(e) => setProjectMemberForm((prev) => ({ ...prev, memberLabel: e.target.value }))} />
            <button type="button" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" disabled={!selectedProject || !projectMemberForm.userId} onClick={() => addProjectMemberMutation.mutate({ projectId: selectedProject, userId: projectMemberForm.userId, role: projectMemberForm.role, memberLabel: projectMemberForm.memberLabel })}>Add to project</button>
            {selectedProjectData && <p className="text-xs text-slate-500">Selected project: <span className="font-semibold text-slate-700">{selectedProjectData.name}</span></p>}
          </div>
        </section>
      </div>

      {selectedProjectQuery.data && (
        <section className="card p-4">
          <h2 className="text-lg font-semibold">Project member labels</h2>
          <div className="mt-3 grid gap-2">
            {selectedProjectQuery.data.members.map((member) => (
              <div key={member.user._id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {member.user?.avatarUrl ? (
                      <img src={member.user.avatarUrl} alt="member avatar" className="h-8 w-8 rounded-full border border-slate-300 object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[11px] font-semibold text-slate-700">
                        {(member.user?.name || "U").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{member.user.name}</p>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                  <input
                    defaultValue={member.memberLabel || ""}
                    className="w-60 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    placeholder="Role label"
                    onBlur={(e) => updateProjectMemberLabelMutation.mutate({ projectId: selectedProject, memberUserId: member.user._id, memberLabel: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        {!selectedTeam && <p className="mt-2 text-sm text-slate-500">Select a team to load projects.</p>}
        {projectsQuery.isLoading && <p className="mt-2 text-sm text-slate-500">Loading projects...</p>}
        {projects.length > 0 && (
          <div className="mt-3 grid gap-2">
            {projects.map((project) => (
              <Link key={project._id} to={`/projects/${project._id}`} className="rounded-xl border border-slate-200 bg-gradient-to-r from-white to-teal-50 p-3 transition hover:border-teal-500">
                <p className="font-semibold">{project.name}</p>
                <p className="text-sm text-slate-500">{project.description || "No description"}</p>
              </Link>
            ))}
          </div>
        )}
        {selectedTeam && projects.length === 0 && <EmptyState title="No projects yet" description="Create your first project for this team." />}
      </section>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ type: "info", message: "" })} />
    </div>
  );
};

export default ProjectsPage;
