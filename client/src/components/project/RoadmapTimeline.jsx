import { formatDate } from "../../utils/helpers";
import Badge from "../common/Badge";

const RoadmapTimeline = ({ project, tasks, members = [] }) => {
  const roadmapTasks = [...tasks]
    .filter((task) => task.status !== "Done" && task.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 8);

  const blockedTasks = tasks
    .filter((task) => task.status !== "Done" && task.blockedByOpenDependencies)
    .slice(0, 4);

  const assigneeLookup = new Map(
    members.map((member) => [String(member.user._id), member.user.name])
  );

  const milestoneItems = [
    project?.deadline
      ? {
          id: "project-deadline",
          label: "Project deadline",
          value: formatDate(project.deadline),
          tone: "warn",
        }
      : null,
    {
      id: "open-items",
      label: "Open items",
      value: String(tasks.filter((task) => task.status !== "Done").length),
      tone: "info",
    },
    {
      id: "blocked-items",
      label: "Blocked chain",
      value: String(blockedTasks.length),
      tone: blockedTasks.length > 0 ? "high" : "low",
    },
  ].filter(Boolean);

  return (
    <section className="card overflow-hidden p-0">
      <div className="roadmap-shell">
        <div className="roadmap-head p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="ds-kicker text-[11px] font-semibold">Timeline / Roadmap</p>
              <h3 className="ds-text mt-2 text-3xl font-black tracking-tight">Delivery path for this project</h3>
              <p className="ds-muted mt-3 max-w-xl text-sm leading-relaxed md:text-base">
                See the next due checkpoints, active dependencies, and the sequence of work that is most likely to affect delivery.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {milestoneItems.map((item) => (
                <div key={item.id} className="roadmap-chip rounded-2xl px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] ds-muted">{item.label}</p>
                  <div className="mt-2">
                    {item.id === "blocked-items" ? (
                      <Badge text={item.value} tone={item.tone} />
                    ) : (
                      <p className="ds-text text-lg font-black">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-px roadmap-grid">
          <div className="roadmap-track p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="ds-text text-sm font-bold uppercase tracking-[0.14em]">Upcoming sequence</h4>
              <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">
                {roadmapTasks.length} checkpoints
              </span>
            </div>

            <div className="roadmap-scroll mt-4">
              {roadmapTasks.map((task, index) => {
                const assigneeName = task.assignee?.name || assigneeLookup.get(String(task.assignee)) || "Unassigned";
                return (
                  <div key={task._id} className="roadmap-card rounded-[1.35rem] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="roadmap-step">{String(index + 1).padStart(2, "0")}</span>
                      <span className="ds-muted text-[11px] font-semibold uppercase tracking-[0.12em]">
                        {formatDate(task.dueDate)}
                      </span>
                    </div>

                    <p className="ds-text mt-4 text-base font-bold">{task.title}</p>
                    <p className="ds-muted mt-1 text-sm">{assigneeName}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge text={task.priority} tone="info" />
                      <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">
                        {task.status}
                      </span>
                      {task.taskType ? (
                        <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">
                          {task.taskType}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-[11px] font-semibold">
                      <span className="ds-muted">
                        {task.dependencyTaskIds?.length ? `${task.dependencyTaskIds.length} dependencies` : "No dependencies"}
                      </span>
                      {task.blockedByOpenDependencies ? <Badge text="Blocked path" tone="high" /> : null}
                    </div>
                  </div>
                );
              })}
              {roadmapTasks.length === 0 ? (
                <div className="roadmap-empty rounded-2xl p-4">
                  <p className="ds-text text-sm font-semibold">No scheduled checkpoints yet.</p>
                  <p className="ds-muted mt-1 text-sm">Add due dates to active tasks to build the roadmap track.</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="roadmap-side p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="ds-text text-sm font-bold uppercase tracking-[0.14em]">Dependency watch</h4>
              <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">
                {blockedTasks.length} blocked
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {blockedTasks.map((task) => (
                <div key={task._id} className="roadmap-watch-item rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="ds-text text-sm font-semibold">{task.title}</p>
                    <Badge text="Blocked" tone="high" />
                  </div>
                  <p className="ds-muted mt-2 text-xs">
                    {task.dependencyTaskIds?.length || 0} open dependencies
                    {task.dueDate ? ` | due ${formatDate(task.dueDate)}` : ""}
                  </p>
                </div>
              ))}
              {blockedTasks.length === 0 ? (
                <div className="roadmap-empty rounded-2xl p-4">
                  <p className="ds-text text-sm font-semibold">No blocked items on the path.</p>
                  <p className="ds-muted mt-1 text-sm">Dependencies are clear right now.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoadmapTimeline;
