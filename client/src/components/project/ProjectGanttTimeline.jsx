import { useMemo, useState } from "react";
import Badge from "../common/Badge";
import { formatDate } from "../../utils/helpers";

const DAY_MS = 1000 * 60 * 60 * 24;

const statusOptions = ["", "Backlog", "To Do", "In Progress", "Review", "Done"];
const taskTypeOptions = ["", "Task", "Bug", "Story"];

const ProjectGanttTimeline = ({ tasks, members = [] }) => {
  const [filters, setFilters] = useState({ assignee: "", status: "", taskType: "" });

  const timelineTasks = useMemo(() => {
    const filtered = tasks
      .filter((task) => task.dueDate)
      .filter((task) => !filters.status || task.status === filters.status)
      .filter((task) => !filters.taskType || task.taskType === filters.taskType)
      .filter((task) => !filters.assignee || (task.assignee && String(task.assignee._id || task.assignee) === filters.assignee))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (filtered.length === 0) {
      return { items: [], totalDays: 1, startDate: new Date(), endDate: new Date(), headers: [] };
    }

    const startDate = new Date(
      Math.min(...filtered.map((task) => new Date(task.createdAt).setHours(0, 0, 0, 0)))
    );
    const endDate = new Date(
      Math.max(...filtered.map((task) => new Date(task.dueDate).setHours(0, 0, 0, 0)))
    );
    const totalDays = Math.max(Math.round((endDate - startDate) / DAY_MS) + 1, 1);

    const headers = Array.from({ length: totalDays }).map((_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return {
        key: `${date.toISOString().slice(0, 10)}`,
        label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      };
    });

    const items = filtered.map((task) => {
      const taskStart = new Date(task.createdAt);
      taskStart.setHours(0, 0, 0, 0);
      const taskEnd = new Date(task.dueDate);
      taskEnd.setHours(0, 0, 0, 0);

      const startOffset = Math.max(Math.round((taskStart - startDate) / DAY_MS), 0);
      const span = Math.max(Math.round((taskEnd - taskStart) / DAY_MS) + 1, 1);

      return {
        ...task,
        startOffset,
        span,
        assigneeName: task.assignee?.name || "Unassigned",
        isOverdue: new Date(task.dueDate) < new Date() && task.status !== "Done",
      };
    });

    return { items, totalDays, startDate, endDate, headers };
  }, [tasks, filters]);

  return (
    <section className="card overflow-hidden p-0">
      <div className="gantt-shell">
        <div className="gantt-head p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="ds-kicker text-[11px] font-semibold">Project Timeline</p>
              <h3 className="ds-text mt-2 text-3xl font-black tracking-tight">Gantt-style execution map</h3>
              <p className="ds-muted mt-3 max-w-xl text-sm leading-relaxed md:text-base">
                Track work from creation to deadline, spot blocked paths, and see who owns each segment of the delivery timeline.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <select className="rounded-2xl border border-slate-300 px-3 py-2" value={filters.assignee} onChange={(event) => setFilters((prev) => ({ ...prev, assignee: event.target.value }))}>
                <option value="">Any assignee</option>
                {members.map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
              <select className="rounded-2xl border border-slate-300 px-3 py-2" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
                {statusOptions.map((status) => (
                  <option key={status || "all"} value={status}>
                    {status || "Any status"}
                  </option>
                ))}
              </select>
              <select className="rounded-2xl border border-slate-300 px-3 py-2" value={filters.taskType} onChange={(event) => setFilters((prev) => ({ ...prev, taskType: event.target.value }))}>
                {taskTypeOptions.map((taskType) => (
                  <option key={taskType || "all"} value={taskType}>
                    {taskType || "Any type"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="gantt-board p-5">
          {timelineTasks.items.length > 0 ? (
            <div className="gantt-table">
              <div className="gantt-header-row">
                <div className="gantt-meta-head ds-muted text-xs font-semibold uppercase tracking-[0.12em]">Task</div>
                <div className="gantt-grid-head" style={{ gridTemplateColumns: `repeat(${timelineTasks.totalDays}, minmax(4.25rem, 1fr))` }}>
                  {timelineTasks.headers.map((header) => (
                    <div key={header.key} className="gantt-date-head">
                      {header.label}
                    </div>
                  ))}
                </div>
              </div>

              {timelineTasks.items.map((task) => (
                <div key={task._id} className="gantt-row">
                  <div className="gantt-row-meta">
                    <p className="ds-text text-sm font-semibold">{task.title}</p>
                    <p className="ds-muted mt-1 text-xs">
                      {task.assigneeName} | {formatDate(task.dueDate)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge text={task.priority} tone="info" />
                      <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">{task.status}</span>
                      {task.blockedByOpenDependencies ? <Badge text="Blocked" tone="high" /> : null}
                      {task.isOverdue ? <Badge text="Overdue" tone="high" /> : null}
                    </div>
                  </div>
                  <div className="gantt-grid-row" style={{ gridTemplateColumns: `repeat(${timelineTasks.totalDays}, minmax(4.25rem, 1fr))` }}>
                    {timelineTasks.headers.map((header) => (
                      <div key={`${task._id}-${header.key}`} className="gantt-grid-cell" />
                    ))}
                    <div
                      className={`gantt-bar ${task.blockedByOpenDependencies ? "gantt-bar-blocked" : task.isOverdue ? "gantt-bar-overdue" : ""}`}
                      style={{
                        gridColumn: `${task.startOffset + 1} / span ${task.span}`,
                      }}
                    >
                      <span>{task.taskType || "Task"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="gantt-empty rounded-2xl p-4">
              <p className="ds-text text-sm font-semibold">No scheduled tasks match the current filters.</p>
              <p className="ds-muted mt-1 text-sm">Tasks need due dates to appear on the Gantt timeline.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProjectGanttTimeline;
