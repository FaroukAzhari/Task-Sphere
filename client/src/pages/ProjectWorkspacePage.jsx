import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import useAuth from "../hooks/useAuth";
import { createTaskApi, fetchTasksApi, moveTaskApi } from "../api/taskApi";
import {
  closeSprintApi,
  createSprintApi,
  fetchProjectApi,
  fetchProjectSprintsApi,
  fetchSprintBurndownApi,
  startSprintApi,
} from "../api/projectApi";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import Toast from "../components/common/Toast";
import KanbanColumn from "../components/kanban/KanbanColumn";
import TaskModal from "../components/kanban/TaskModal";
import ProjectGanttTimeline from "../components/project/ProjectGanttTimeline";
import ProjectHub from "../components/project/ProjectHub";
import RoadmapTimeline from "../components/project/RoadmapTimeline";
import { buildDetailMessages, normalizeApiError } from "../utils/apiError";
import { groupTasksByStatus } from "../utils/helpers";

const STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Done"];
const TASK_TYPES = ["Task", "Bug", "Story"];
const WORKSPACE_VIEWS = ["Board", "Timeline", "Hub"];

const getTaskAssigneeId = (task) => {
  if (!task?.assignee) return "";
  if (typeof task.assignee === "string") return task.assignee;
  return task.assignee._id || "";
};

const todayIso = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const buildTaskPayload = (taskForm, projectId) => ({
  projectId,
  title: taskForm.title.trim(),
  priority: taskForm.priority,
  status: taskForm.status,
  taskType: taskForm.taskType,
  storyPoints: taskForm.taskType === "Story" ? Number(taskForm.storyPoints) : undefined,
  assignee: taskForm.assignee || undefined,
  dueDate: taskForm.dueDate ? taskForm.dueDate : undefined,
});

const getSprintPointValue = (task) => task.storyPoints || task.estimatedEffort || 1;

const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [activeView, setActiveView] = useState("Board");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ priority: "", assignee: "", taskType: "" });
  const [statusView, setStatusView] = useState("All");
  const [toast, setToast] = useState({ type: "info", message: "", details: [] });
  const [taskForm, setTaskForm] = useState({
    title: "",
    priority: "Medium",
    status: "Backlog",
    taskType: "Task",
    storyPoints: "",
    assignee: "",
    dueDate: "",
  });
  const [sprintForm, setSprintForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
    capacity: 20,
    taskIds: [],
  });

  const taskQueryKey = ["tasks", projectId];
  const deferredSearch = useDeferredValue(search);
  const minDate = todayIso();

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => fetchProjectApi(projectId) });
  const tasksQuery = useQuery({
    queryKey: taskQueryKey,
    queryFn: () => fetchTasksApi({ projectId, limit: 100 }),
    enabled: Boolean(projectId),
  });
  const sprintsQuery = useQuery({
    queryKey: ["project-sprints", projectId],
    queryFn: () => fetchProjectSprintsApi(projectId),
    enabled: Boolean(projectId),
  });
  const burndownQuery = useQuery({
    queryKey: ["sprint-burndown", projectId, selectedSprintId],
    queryFn: () => fetchSprintBurndownApi({ projectId, sprintId: selectedSprintId }),
    enabled: Boolean(selectedSprintId),
  });

  const moveTaskMutation = useMutation({
    mutationFn: moveTaskApi,
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKey });
      const previous = queryClient.getQueryData(taskQueryKey);
      queryClient.setQueryData(taskQueryKey, (old = []) => old.map((task) => (task._id === taskId ? { ...task, status } : task)));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(taskQueryKey, context.previous);
      const parsed = normalizeApiError(_error, "The task could not be moved.");
      setToast({ type: "error", message: parsed.summary, details: buildDetailMessages(parsed) });
    },
    onSuccess: () => setToast({ type: "success", message: "Task moved." }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["project-sprints", projectId] });
      if (selectedSprintId) await queryClient.invalidateQueries({ queryKey: ["sprint-burndown", projectId, selectedSprintId] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: createTaskApi,
    onSuccess: async (createdTask) => {
      setTaskForm((prev) => ({ ...prev, title: "", storyPoints: "", dueDate: "" }));
      setToast({ type: "success", message: `${createdTask.taskType} created in ${createdTask.status}.` });
      queryClient.setQueryData(taskQueryKey, (old = []) => [createdTask, ...old]);
      await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => {
      const parsed = normalizeApiError(error, "The work item could not be created.");
      setToast({ type: "error", message: parsed.summary, details: buildDetailMessages(parsed) });
    },
  });

  const createSprintMutation = useMutation({
    mutationFn: createSprintApi,
    onSuccess: async () => {
      setSprintForm({ name: "", goal: "", startDate: "", endDate: "", capacity: 20, taskIds: [] });
      setToast({ type: "success", message: "Sprint created." });
      await queryClient.invalidateQueries({ queryKey: ["project-sprints", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => {
      const parsed = normalizeApiError(error, "The sprint could not be created.");
      setToast({ type: "error", message: parsed.summary, details: buildDetailMessages(parsed) });
    },
  });

  const startSprintMutation = useMutation({
    mutationFn: startSprintApi,
    onSuccess: async () => {
      setToast({ type: "success", message: "Sprint started." });
      await queryClient.invalidateQueries({ queryKey: ["project-sprints", projectId] });
      if (selectedSprintId) await queryClient.invalidateQueries({ queryKey: ["sprint-burndown", projectId, selectedSprintId] });
    },
    onError: (error) => {
      const parsed = normalizeApiError(error, "The sprint could not be started.");
      setToast({ type: "error", message: parsed.summary, details: buildDetailMessages(parsed) });
    },
  });

  const closeSprintMutation = useMutation({
    mutationFn: closeSprintApi,
    onSuccess: async () => {
      setToast({ type: "success", message: "Sprint closed." });
      await queryClient.invalidateQueries({ queryKey: ["project-sprints", projectId] });
      if (selectedSprintId) await queryClient.invalidateQueries({ queryKey: ["sprint-burndown", projectId, selectedSprintId] });
    },
    onError: (error) => {
      const parsed = normalizeApiError(error, "The sprint could not be closed.");
      setToast({ type: "error", message: parsed.summary, details: buildDetailMessages(parsed) });
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("task_sphere_token");
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", { auth: { token } });

    socket.emit("project:join", projectId);
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    socket.on("task:created", refresh);
    socket.on("task:updated", refresh);
    socket.on("task:moved", refresh);
    socket.on("task:commented", refresh);

    return () => {
      socket.emit("project:leave", projectId);
      socket.disconnect();
    };
  }, [projectId, queryClient]);

  const tasks = tasksQuery.data || [];
  const projectMembers = projectQuery.data?.members || [];
  const sprints = sprintsQuery.data || [];
  const currentMember = projectMembers.find((member) => member.user._id === user?._id);
  const currentRole = currentMember?.role || "Viewer";
  const canRunSprint = ["Project Manager", "Team Lead"].includes(currentRole);
  const canContribute = ["Admin", "Project Manager", "Team Lead", "Member"].includes(currentRole);
  const canModerateHub = ["Admin", "Project Manager", "Team Lead"].includes(currentRole);

  useEffect(() => {
    if (!selectedSprintId && sprints.length > 0) setSelectedSprintId(sprints[0]._id);
  }, [selectedSprintId, sprints]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !normalizedSearch ||
        task.title?.toLowerCase().includes(normalizedSearch) ||
        task.description?.toLowerCase().includes(normalizedSearch) ||
        task.assignee?.name?.toLowerCase().includes(normalizedSearch);
      const matchesPriority = !filters.priority || task.priority === filters.priority;
      const matchesTaskType = !filters.taskType || task.taskType === filters.taskType;
      const matchesAssignee = !filters.assignee || getTaskAssigneeId(task) === filters.assignee;

      return matchesSearch && matchesPriority && matchesTaskType && matchesAssignee;
    });
  }, [tasks, deferredSearch, filters.priority, filters.taskType, filters.assignee]);

  const visibleTasks = useMemo(
    () => (statusView === "All" ? filteredTasks : filteredTasks.filter((task) => task.status === statusView)),
    [filteredTasks, statusView]
  );
  const grouped = useMemo(() => groupTasksByStatus(visibleTasks), [visibleTasks]);

  const statusCounts = useMemo(() => {
    const allGrouped = groupTasksByStatus(filteredTasks);
    const counts = { All: filteredTasks.length };
    STATUSES.forEach((status) => {
      counts[status] = allGrouped[status]?.length || 0;
    });
    return counts;
  }, [filteredTasks]);

  const selectedSprint = useMemo(
    () => sprints.find((sprint) => String(sprint._id) === String(selectedSprintId)) || null,
    [sprints, selectedSprintId]
  );

  const selectedSprintTasks = useMemo(
    () => tasks.filter((task) => selectedSprint?.taskIds?.some((id) => String(id) === String(task._id))),
    [tasks, selectedSprint]
  );

  const selectedSprintScope = useMemo(() => {
    const totalPoints = selectedSprintTasks.reduce((sum, task) => sum + getSprintPointValue(task), 0);
    const storyPoints = selectedSprintTasks
      .filter((task) => task.taskType === "Story")
      .reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const nonStoryEffort = selectedSprintTasks
      .filter((task) => task.taskType !== "Story")
      .reduce((sum, task) => sum + (task.estimatedEffort || 1), 0);

    return {
      totalPoints,
      storyPoints,
      nonStoryEffort,
      itemCount: selectedSprintTasks.length,
    };
  }, [selectedSprintTasks]);

  const sprintContext = useMemo(
    () => ({
      selectedSprintId,
      isActive: selectedSprint?.status === "Active",
    }),
    [selectedSprint, selectedSprintId]
  );

  const handleDragEnd = (event) => {
    const task = event.active.data.current?.task;
    const newStatus = event.over?.id;
    if (!task || !newStatus || task.status === newStatus) return;
    moveTaskMutation.mutate({ taskId: task._id, status: newStatus });
  };

  const handleCreateTask = () => {
    const payload = buildTaskPayload(taskForm, projectId);
    if (!payload.title) return setToast({ type: "error", message: "Task title is required.", details: [] });
    if (payload.taskType === "Story" && (!payload.storyPoints || payload.storyPoints < 1)) {
      return setToast({ type: "error", message: "Story points must be a positive integer.", details: [] });
    }
    if (payload.dueDate && payload.dueDate < minDate) {
      return setToast({
        type: "error",
        message: "Due date cannot be earlier than today.",
        details: ["Pick today or a future date for this work item."],
      });
    }
    createTaskMutation.mutate(payload);
  };

  const handleCreateSprint = () => {
    if (sprintForm.startDate < minDate || sprintForm.endDate < minDate) {
      return setToast({
        type: "error",
        message: "Sprint dates cannot be earlier than today.",
        details: ["Set both sprint start and end dates to today or later."],
      });
    }

    if (sprintForm.endDate < sprintForm.startDate) {
      return setToast({
        type: "error",
        message: "Sprint end date must be on or after the start date.",
        details: ["Adjust the sprint date range before creating it."],
      });
    }

    createSprintMutation.mutate({ projectId, payload: sprintForm });
  };

  const handleSprintTaskSelection = (taskId, checked) => {
    setSprintForm((prev) => ({
      ...prev,
      taskIds: checked ? [...prev.taskIds, taskId] : prev.taskIds.filter((id) => id !== taskId),
    }));
  };

  const availableSprintTasks = tasks.filter((task) => !task.sprint && task.status !== "Done");

  if (projectQuery.isLoading || (tasksQuery.isLoading && !tasksQuery.data)) return <LoadingState label="Loading workspace" />;
  if (projectQuery.isError) return <EmptyState title="Project unavailable" description="Project could not be loaded." />;

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ds-kicker text-[11px] font-semibold">Project Workspace</p>
            <h2 className="ds-text mt-2 text-3xl font-black tracking-tight md:text-5xl">{projectQuery.data.name}</h2>
            <p className="ds-muted mt-2 max-w-2xl text-sm md:text-base">
              {projectQuery.data.description || ""}
            </p>
          </div>
          <div className="workspace-tabs">
            {WORKSPACE_VIEWS.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`workspace-tab ${activeView === view ? "workspace-tab-active" : ""}`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeView === "Board" ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
            <section className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="ds-kicker text-[11px] font-semibold">Create Work Item</p>
                  <h3 className="ds-text mt-2 text-xl font-black">Add task, bug, or story</h3>
                </div>
                <span className="settings-pill rounded-full px-3 py-1 text-xs font-semibold">{currentRole}</span>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-8">
                <input className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Title" value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} />
                <select className="rounded-xl border border-slate-300 px-3 py-2" value={taskForm.taskType} onChange={(e) => setTaskForm((prev) => ({ ...prev, taskType: e.target.value, storyPoints: "" }))}>
                  {TASK_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
                {taskForm.taskType === "Story" && <input type="number" min={1} className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Story points" value={taskForm.storyPoints} onChange={(e) => setTaskForm((prev) => ({ ...prev, storyPoints: e.target.value }))} />}
                <select className="rounded-xl border border-slate-300 px-3 py-2" value={taskForm.priority} onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select>
                <select className="rounded-xl border border-slate-300 px-3 py-2" value={taskForm.status} onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
                <select className="rounded-xl border border-slate-300 px-3 py-2" value={taskForm.assignee} onChange={(e) => setTaskForm((prev) => ({ ...prev, assignee: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {projectMembers.map((member) => <option key={member.user._id} value={member.user._id}>{member.user.name}{member.memberLabel ? ` - ${member.memberLabel}` : ""}</option>)}
                </select>
                <input type="date" min={minDate} className="rounded-xl border border-slate-300 px-3 py-2" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button type="button" disabled={createTaskMutation.isPending || !canContribute} className="ds-btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60" onClick={handleCreateTask}>{createTaskMutation.isPending ? "Adding..." : `Add ${taskForm.taskType}`}</button>
                <p className="ds-muted text-xs">Assign now or keep it unassigned. New work stays on the board immediately, but only sprint-allocated items affect sprint burndown.</p>
              </div>
            </section>

            <section className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="ds-kicker text-[11px] font-semibold">Sprint Module</p>
                  <h3 className="ds-text mt-2 text-xl font-black">Run and monitor sprint flow</h3>
                </div>
                <p className="ds-muted text-xs">Only Project Manager and Team Lead can run sprints.</p>
              </div>

              {canRunSprint ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="dashboard-summary-panel rounded-2xl p-3">
                    <p className="ds-text text-sm font-semibold">Create sprint</p>
                    <div className="mt-3 space-y-2">
                      <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Sprint name" value={sprintForm.name} onChange={(e) => setSprintForm((prev) => ({ ...prev, name: e.target.value }))} />
                      <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Sprint goal" value={sprintForm.goal} onChange={(e) => setSprintForm((prev) => ({ ...prev, goal: e.target.value }))} />
                      <div className="grid gap-2 md:grid-cols-3">
                        <input type="date" min={minDate} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={sprintForm.startDate} onChange={(e) => setSprintForm((prev) => ({ ...prev, startDate: e.target.value }))} />
                        <input type="date" min={sprintForm.startDate || minDate} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={sprintForm.endDate} onChange={(e) => setSprintForm((prev) => ({ ...prev, endDate: e.target.value }))} />
                        <input type="number" min={1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={sprintForm.capacity} onChange={(e) => setSprintForm((prev) => ({ ...prev, capacity: Number(e.target.value) || 1 }))} />
                      </div>
                      <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                        {availableSprintTasks.map((task) => (
                          <label key={task._id} className="flex items-center gap-2 text-xs ds-text">
                            <input type="checkbox" checked={sprintForm.taskIds.includes(task._id)} onChange={(e) => handleSprintTaskSelection(task._id, e.target.checked)} />
                            <span>{task.title}</span>
                          </label>
                        ))}
                        {availableSprintTasks.length === 0 && <p className="ds-muted text-xs">No unassigned active tasks.</p>}
                      </div>
                      <button
                        type="button"
                        className="ds-btn-secondary rounded-lg px-3 py-2 text-xs font-semibold"
                        onClick={handleCreateSprint}
                        disabled={!sprintForm.name || !sprintForm.startDate || !sprintForm.endDate}
                      >
                        Create sprint
                      </button>
                    </div>
                  </div>

                  <div className="dashboard-summary-panel rounded-2xl p-3">
                    <p className="ds-text text-sm font-semibold">Sprint run controls</p>
                    <div className="mt-3 space-y-3">
                      <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={selectedSprintId} onChange={(e) => setSelectedSprintId(e.target.value)}>
                        <option value="">Select sprint</option>
                        {sprints.map((sprint) => <option key={sprint._id} value={sprint._id}>{sprint.name} ({sprint.status})</option>)}
                      </select>
                      <div className="flex gap-2">
                        <button type="button" className="ds-btn-primary rounded-lg px-3 py-2 text-xs font-semibold" disabled={!selectedSprintId} onClick={() => startSprintMutation.mutate({ projectId, sprintId: selectedSprintId })}>Start sprint</button>
                        <button type="button" className="ds-btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" disabled={!selectedSprintId} onClick={() => closeSprintMutation.mutate({ projectId, sprintId: selectedSprintId })}>Close sprint</button>
                      </div>
                      
                      <div className="h-44 rounded-lg border border-slate-200 bg-slate-50/50 p-2">
                        {burndownQuery.data?.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={burndownQuery.data.map((entry, idx) => ({ ...entry, step: idx + 1 }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="step" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="remainingPoints" stroke="#ef4444" strokeWidth={2} />
                              <Line type="monotone" dataKey="completedPoints" stroke="#0f766e" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="p-4 text-xs ds-muted">Select a sprint to view burndown.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm ds-muted">You do not have permission to run sprints in this project.</p>
              )}
            </section>
          </section>

          <section className="card p-4">
            {selectedSprint?.status === "Active" ? (
              <div className="mb-3 rounded-2xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
                <p className="font-semibold">Active sprint scope is locked to allocated items.</p>
                <p className="mt-1 text-xs text-teal-800">
                  Cards labeled <strong>Counts in sprint</strong> contribute to burndown. Cards labeled <strong>Outside sprint scope</strong> stay visible on the Kanban board but do not change sprint metrics.
                </p>
              </div>
            ) : null}
            <div className="grid gap-2 md:grid-cols-4">
              <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="rounded-xl border border-slate-300 px-3 py-2" value={filters.priority} onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}><option value="">All priorities</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select>
              <select className="rounded-xl border border-slate-300 px-3 py-2" value={filters.taskType} onChange={(e) => setFilters((prev) => ({ ...prev, taskType: e.target.value }))}><option value="">All types</option>{TASK_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
              <select className="rounded-xl border border-slate-300 px-3 py-2" value={filters.assignee} onChange={(e) => setFilters((prev) => ({ ...prev, assignee: e.target.value }))}>
                <option value="">Any assignee</option>
                {projectMembers.map((member) => <option key={member.user._id} value={member.user._id}>{member.user.name}</option>)}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {["All", ...STATUSES].map((status) => (
                  <button key={status} type="button" onClick={() => setStatusView(status)} className={`workspace-filter-pill ${statusView === status ? "workspace-filter-pill-active" : ""}`}>
                    {status} ({statusCounts[status] || 0})
                  </button>
                ))}
              </div>
              <div className="text-xs ds-muted">
                <span>{filteredTasks.length} matching {filteredTasks.length === 1 ? "task" : "tasks"}</span>
                {tasksQuery.isFetching ? <span className="ml-2">Refreshing board...</span> : null}
              </div>
            </div>
          </section>

          <DndContext onDragEnd={handleDragEnd}>
            <section className="grid gap-3 xl:grid-cols-5">
              {STATUSES.map((status) => (
                <KanbanColumn key={status} status={status} tasks={grouped[status] || []} onOpenTask={setSelectedTaskId} showStatusHint={statusView !== "All"} sprintContext={sprintContext} />
              ))}
            </section>
          </DndContext>
        </>
      ) : null}

      {activeView === "Timeline" ? (
        <>
          <RoadmapTimeline project={projectQuery.data} tasks={tasks} members={projectMembers} />
          <ProjectGanttTimeline tasks={tasks} members={projectMembers} />
        </>
      ) : null}

      {activeView === "Hub" ? (
        <ProjectHub
          projectId={projectId}
          canContribute={canContribute}
          canModerate={canModerateHub}
        />
      ) : null}

      {selectedTaskId && <TaskModal taskId={selectedTaskId} onClose={() => setSelectedTaskId("")} />}
      <Toast message={toast.message} details={toast.details} type={toast.type} onClose={() => setToast({ type: "info", message: "", details: [] })} />
    </div>
  );
};

export default ProjectWorkspacePage;
