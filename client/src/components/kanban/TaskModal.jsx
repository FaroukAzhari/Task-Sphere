import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCommentApi, fetchTaskApi, updateTaskApi } from "../../api/taskApi";
import LoadingState from "../common/LoadingState";
import Badge from "../common/Badge";

const TaskModal = ({ taskId, onClose }) => {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const taskQuery = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTaskApi(taskId),
    enabled: Boolean(taskId),
  });

  const commentMutation = useMutation({
    mutationFn: addCommentApi,
    onSuccess: async () => {
      setComment("");
      await queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTaskApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  if (!taskId) return null;

  const task = taskQuery.data;
  const canEditTask = Boolean(task?.canEditTask);
  const canManageTaskFields = Boolean(task?.canManageTaskFields);

  const updateDependencies = (dependencyId, enabled) => {
    const currentIds = (task.dependencyTaskIds || []).map((item) => item._id);
    const dependencyTaskIds = enabled
      ? [...new Set([...currentIds, dependencyId])]
      : currentIds.filter((id) => id !== dependencyId);

    updateMutation.mutate({
      taskId: task._id,
      payload: { dependencyTaskIds },
    });
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 px-3">
      <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-4">
        <button type="button" onClick={onClose} className="float-right rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
          Close
        </button>

        {taskQuery.isLoading && <LoadingState label="Loading task" />}
        {task && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-[linear-gradient(135deg,#eff6ff,#ffffff_55%,#fef3c7)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Work item</p>
                  <h3 className="mt-2 text-2xl font-black">{task.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{task.description || "No description"}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Access</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {canEditTask ? (canManageTaskFields ? "Project control" : "Assigned work") : "Read only"}
                  </p>
                  <p className="text-xs text-slate-500">{task.currentUserProjectRole || "Member"}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge text={task.priority} tone="info" />
              <Badge
                text={`Risk: ${task.deadlineRisk}`}
                tone={task.deadlineRisk === "High" ? "high" : task.deadlineRisk === "Medium" ? "medium" : "low"}
              />
              <Badge text={task.taskType || "Task"} tone="default" />
              {task.taskType === "Story" && task.storyPoints ? <Badge text={`${task.storyPoints} story points`} tone="medium" /> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Core details</p>
                <div className="mt-3 grid gap-2">
                  <label className="text-sm font-semibold">Title</label>
                  <input
                    defaultValue={task.title}
                    disabled={!canManageTaskFields}
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    onBlur={(e) => {
                      const nextTitle = e.target.value.trim();
                      if (nextTitle && nextTitle !== task.title) {
                        updateMutation.mutate({ taskId: task._id, payload: { title: nextTitle } });
                      }
                    }}
                  />
                  <label className="mt-2 text-sm font-semibold">Description</label>
                  <textarea
                    defaultValue={task.description || ""}
                    disabled={!canManageTaskFields}
                    rows={3}
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    onBlur={(e) => {
                      if (e.target.value !== (task.description || "")) {
                        updateMutation.mutate({ taskId: task._id, payload: { description: e.target.value } });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Workflow</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <label className="text-sm font-semibold">Status</label>
                  <label className="text-sm font-semibold">Priority</label>
                  <select
                    value={task.status}
                    disabled={!canEditTask}
                    onChange={(e) => updateMutation.mutate({ taskId: task._id, payload: { status: e.target.value } })}
                    className="rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option>Backlog</option>
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Review</option>
                    <option>Done</option>
                  </select>
                  <select
                    value={task.priority}
                    disabled={!canEditTask}
                    onChange={(e) => updateMutation.mutate({ taskId: task._id, payload: { priority: e.target.value } })}
                    className="rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ownership</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <label className="text-sm font-semibold">Type</label>
                  <label className="text-sm font-semibold">Assignee</label>
                  <select
                    value={task.taskType || "Task"}
                    disabled={!canManageTaskFields}
                    onChange={(e) => updateMutation.mutate({ taskId: task._id, payload: { taskType: e.target.value } })}
                    className="rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option>Task</option>
                    <option>Bug</option>
                    <option>Story</option>
                  </select>
                  <select
                    value={task.assignee?._id || ""}
                    disabled={!canManageTaskFields}
                    onChange={(e) => updateMutation.mutate({ taskId: task._id, payload: { assignee: e.target.value || null } })}
                    className="rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="">Unassigned</option>
                    {(task.projectMembers || []).map((member) => (
                      <option key={member.user._id} value={member.user._id}>
                        {member.user.name}
                        {member.memberLabel ? ` - ${member.memberLabel}` : ""}
                      </option>
                    ))}
                  </select>
                  <label className="text-sm font-semibold">Due date</label>
                  <div />
                  <input
                    type="date"
                    value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
                    disabled={!canManageTaskFields}
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    onChange={(e) => updateMutation.mutate({ taskId: task._id, payload: { dueDate: e.target.value || null } })}
                  />
                </div>
              </div>
            </div>

            {task.taskType === "Story" && (
              <div className="rounded-2xl border border-slate-200 p-4">
                <label className="block text-sm font-semibold">Story points</label>
                <input
                  type="number"
                  min={1}
                  disabled={!canManageTaskFields}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  defaultValue={task.storyPoints || 1}
                  onBlur={(e) =>
                    updateMutation.mutate({
                      taskId: task._id,
                      payload: { storyPoints: Number(e.target.value) || 1 },
                    })
                  }
                />
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Dependency graph</h4>
                  {task.dependencyTaskIds.length > 0 ? <Badge text={`${task.dependencyTaskIds.length} linked`} tone="medium" /> : null}
                </div>
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Current item</p>
                    <p className="mt-1 text-sm font-semibold">{task.title}</p>
                  </div>
                  {task.dependencyTaskIds.map((dependency) => (
                    <div key={dependency._id} className="rounded-2xl border border-slate-200 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Blocked by</p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{dependency.title}</p>
                        <Badge text={dependency.status} tone={dependency.status === "Done" ? "low" : "high"} />
                      </div>
                    </div>
                  ))}
                  {task.dependencyTaskIds.length === 0 && <p className="text-sm text-slate-500">No blocking dependencies.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="font-semibold">Link blockers</h4>
                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                  {(task.availableDependencyTasks || []).map((dependency) => {
                    const checked = task.dependencyTaskIds.some((item) => item._id === dependency._id);
                    return (
                      <label key={dependency._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                        <div>
                          <p className="font-semibold">{dependency.title}</p>
                          <p className="text-xs text-slate-500">{dependency.status}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canManageTaskFields}
                          onChange={(e) => updateDependencies(dependency._id, e.target.checked)}
                        />
                      </label>
                    );
                  })}
                  {(task.availableDependencyTasks || []).length === 0 && <p className="text-sm text-slate-500">No other tasks available to link.</p>}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <h4 className="font-semibold">Comments</h4>
              <div className="mt-2 space-y-2">
                {task.comments.map((item) => (
                  <div key={item._id} className="rounded-lg border border-slate-200 p-2">
                    <p className="text-xs text-slate-500">{item.author?.name || "User"}</p>
                    <p className="text-sm">{item.content}</p>
                  </div>
                ))}
                {task.comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="Write a comment"
                />
                <button
                  type="button"
                  disabled={!comment.trim()}
                  className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  onClick={() => commentMutation.mutate({ taskId, content: comment })}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskModal;
