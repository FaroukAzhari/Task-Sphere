import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

const KanbanColumn = ({ status, tasks, onOpenTask, showStatusHint = false }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-72 rounded-2xl border p-3 transition ${
        isOver ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{status}</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} onOpen={onOpenTask} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-3 text-xs text-slate-500">
            {showStatusHint ? "Hidden by status filter" : `No tasks in ${status}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
