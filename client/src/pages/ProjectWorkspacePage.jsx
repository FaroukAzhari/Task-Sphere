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
import { groupTasksByStatus } from "../utils/helpers";

const STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Done"];
const TASK_TYPES = ["Task", "Bug", "Story"];

const getTaskAssigneeId = (task) => {
  if (!task?.assignee) return "";
  if (typeof task.assignee === "string") return task.assignee;
  return task.assignee._id || "";
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

const ProjectWorkspacePage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ priority: "", assignee: "", taskType: "" });
  const [statusView, setStatusView] = useState("All");
  const [toast, setToast] = useState({ type: "info", message: "" });
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
      setToast({ type: "error", message: "Task move failed. Try again." });
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
    onError: (error) => setToast({ type: "error", message: error?.response?.data?.message || "Could not create task." }),
  });

  const createSprintMutation = useMutation({
    mutationFn: createSprintApi,
    onSuccess: async () => {
      setSprintForm({ name: "", goal: "", startDate: "", endDate: "", capacity: 20, taskIds: [] });
      setToast({ type: "success", message: "Sprint created." });
      await queryClient.invalidateQueries({ queryKey: ["project-sprints", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => setToast({ type: "error", message: error?.response?.data?.message || "Could not create sprint." }),
  });

  const startSprintMutation = useMutation({
    mutationFn: startSprintApi,
    onSuccess: async () => {
      setToast({ type: "success", message: "Sprint started." });
      await queryClient.invalidateQueries({ queryKey: ["project-sprints", projectId] });
      if (selectedSprintId) await queryClient.invalidateQueries({ queryKey: ["sprint-burndown", projectId, selectedSprintId] });
    },
    onError: (error) => setToast({ type: "error", message: error?.response?.data?.message || "Could not start sprint." }),
  });

  const closeSprintMutation = useMutation({
    mutationFn: closeSprintApi,
    onSuccess: async () => {
      setToast({ type: "success", message: "Sprint closed." });
      await queryClient.invalidateQueries({ queryKey: ["project-sprints", projectId] });
      if (selectedSprintId) await queryClient.invalidateQueries({ queryKey: ["sprint-burndown", projectId, selectedSprintId] });
    },
    onError: (error) => setToast({ type: "error", message: error?.response?.data?.message || "Could not close sprint." }),
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
  const canRunSprint = ["Project Manager", "Team Lead"].includes(currentMember?.role);

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

  const handleDragEnd = (event) => {
    const task = event.active.data.current?.task;
    const newStatus = event.over?.id;
    if (!task || !newStatus || task.status === newStatus) return;
    moveTaskMutation.mutate({ taskId: task._id, status: newStatus });
  };

  const handleCreateTask = () => {
    const payload = buildTaskPayload(taskForm, projectId);
    if (!payload.title) return setToast({ type: "error", message: "Task title is required." });
    if (payload.taskType === "Story" && (!payload.storyPoints || payload.storyPoints < 1)) {
      return setToast({ type: "error", message: "Story points must be a positive integer." });
    }
    createTaskMutation.mutate(payload);
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Project workspace</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">{projectQuery.data.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{projectQuery.data.description || "No description"}</p>
          </div>
          <div className="flex gap-2">
            {["All", ...STATUSES].map((status) => (
              <button key={status} type="button" onClick={() => setStatusView(status)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${statusView === status ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {status} ({statusCounts[status] || 0})
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-4">
        <h3 className="text-lg font-semibold">Create work item</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-8">
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
          <input type="date" className="rounded-xl border border-slate-300 px-3 py-2" value={taskForm.dueDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <button type="button" disabled={createTaskMutation.isPending} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60" onClick={handleCreateTask}>{createTaskMutation.isPending ? "Adding..." : `Add ${taskForm.taskType}`}</button>
          <p className="text-xs text-slate-500">Assign to a project member now or keep it unassigned.</p>
        </div>
      </section>

      <section className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Sprint module</h3>
          <p className="text-xs text-slate-500">Only Project Manager and Team Lead can run sprints.</p>
        </div>

        {canRunSprint ? (
          <div className="mt-3 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white/70 p-3">
              <p className="text-sm font-semibold">Create sprint</p>
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Sprint name" value={sprintForm.name} onChange={(e) => setSprintForm((prev) => ({ ...prev, name: e.target.value }))} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Sprint goal" value={sprintForm.goal} onChange={(e) => setSprintForm((prev) => ({ ...prev, goal: e.target.value }))} />
              <div className="grid gap-2 md:grid-cols-3">
                <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={sprintForm.startDate} onChange={(e) => setSprintForm((prev) => ({ ...prev, startDate: e.target.value }))} />
                <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={sprintForm.endDate} onChange={(e) => setSprintForm((prev) => ({ ...prev, endDate: e.target.value }))} />
                <input type="number" min={1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={sprintForm.capacity} onChange={(e) => setSprintForm((prev) => ({ ...prev, capacity: Number(e.target.value) || 1 }))} />
              </div>
              <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {availableSprintTasks.map((task) => (
                  <label key={task._id} className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={sprintForm.taskIds.includes(task._id)} onChange={(e) => handleSprintTaskSelection(task._id, e.target.checked)} />
                    <span>{task.title}</span>
                  </label>
                ))}
                {availableSprintTasks.length === 0 && <p className="text-xs text-slate-500">No unassigned active tasks.</p>}
              </div>
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                onClick={() => createSprintMutation.mutate({ projectId, payload: sprintForm })}
                disabled={!sprintForm.name || !sprintForm.startDate || !sprintForm.endDate}
              >
                Create sprint
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-white/70 p-3">
              <p className="text-sm font-semibold">Sprint run controls</p>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={selectedSprintId} onChange={(e) => setSelectedSprintId(e.target.value)}>
                <option value="">Select sprint</option>
                {sprints.map((sprint) => <option key={sprint._id} value={sprint._id}>{sprint.name} ({sprint.status})</option>)}
              </select>
              <div className="flex gap-2">
                <button type="button" className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white" disabled={!selectedSprintId} onClick={() => startSprintMutation.mutate({ projectId, sprintId: selectedSprintId })}>Start sprint</button>
                <button type="button" className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white" disabled={!selectedSprintId} onClick={() => closeSprintMutation.mutate({ projectId, sprintId: selectedSprintId })}>Close sprint</button>
              </div>
              <div className="h-44 rounded-lg border border-slate-200 bg-slate-50 p-2">
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
                  <p className="p-4 text-xs text-slate-500">Select a sprint to view burndown.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">You do not have permission to run sprints in this project.</p>
        )}
      </section>

      <section className="card p-4">
        <div className="grid gap-2 md:grid-cols-4">
          <input className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="rounded-xl border border-slate-300 px-3 py-2" value={filters.priority} onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}><option value="">All priorities</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select>
          <select className="rounded-xl border border-slate-300 px-3 py-2" value={filters.taskType} onChange={(e) => setFilters((prev) => ({ ...prev, taskType: e.target.value }))}><option value="">All types</option>{TASK_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
          <select className="rounded-xl border border-slate-300 px-3 py-2" value={filters.assignee} onChange={(e) => setFilters((prev) => ({ ...prev, assignee: e.target.value }))}>
            <option value="">Any assignee</option>
            {projectMembers.map((member) => <option key={member.user._id} value={member.user._id}>{member.user.name}</option>)}
          </select>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>{filteredTasks.length} matching {filteredTasks.length === 1 ? "task" : "tasks"}</span>
          {tasksQuery.isFetching ? <span>Refreshing board...</span> : null}
        </div>
      </section>

      <DndContext onDragEnd={handleDragEnd}>
        <section className="grid gap-3 xl:grid-cols-5">
          {STATUSES.map((status) => (
            <KanbanColumn key={status} status={status} tasks={grouped[status] || []} onOpenTask={setSelectedTaskId} showStatusHint={statusView !== "All"} />
          ))}
        </section>
      </DndContext>

      {selectedTaskId && <TaskModal taskId={selectedTaskId} onClose={() => setSelectedTaskId("")} />}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ type: "info", message: "" })} />
    </div>
  );
};

export default ProjectWorkspacePage;
