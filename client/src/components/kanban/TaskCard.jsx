import { useDraggable } from "@dnd-kit/core";
import Badge from "../common/Badge";

const TaskCard = ({ task, onOpen, sprintContext = null }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { task },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const isInSelectedSprint = Boolean(
    sprintContext?.selectedSprintId &&
    task.sprint &&
    String(task.sprint) === String(sprintContext.selectedSprintId)
  );
  const hasActiveSprint = Boolean(sprintContext?.isActive);

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      className={`w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md ${
        isDragging ? "opacity-70 scale-[1.01]" : ""
      }`}
      onClick={() => onOpen(task._id)}
      {...listeners}
      {...attributes}
    >
      <p className="text-sm font-semibold text-slate-900">{task.title}</p>
      <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5">{task.taskType || "Task"}</span>
        {task.taskType === "Story" && task.storyPoints ? (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700">{task.storyPoints} SP</span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Badge text={task.priority} tone={task.priority === "Critical" || task.priority === "High" ? "high" : "medium"} />
        <p className="text-xs text-slate-500">
          {task.assignee?.name || "Unassigned"}
          {task.assigneeProjectLabel ? ` (${task.assigneeProjectLabel})` : ""}
        </p>
      </div>
      {hasActiveSprint ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          {isInSelectedSprint ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Counts in sprint</span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Outside sprint scope</span>
          )}
        </div>
      ) : null}
    </button>
  );
};

export default TaskCard;
