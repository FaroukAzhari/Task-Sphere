import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsApi } from "../api/analyticsApi";
import StatCard from "../components/dashboard/StatCard";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import Badge from "../components/common/Badge";
import PersonalWorkConsole from "../components/dashboard/PersonalWorkConsole";
import { formatDate } from "../utils/helpers";

const DashboardPage = () => {
  const analyticsQuery = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: () => fetchAnalyticsApi({}),
  });

  if (analyticsQuery.isLoading) return <LoadingState label="Loading dashboard" />;
  if (analyticsQuery.isError) {
    return <EmptyState title="Analytics unavailable" description="Create a project and tasks to see dashboard metrics." />;
  }

  const data = analyticsQuery.data;
  const topFocus = data.personalConsole?.focusQueue?.slice(0, 3) || [];
  const topBlocked = data.standup.blockedTasks.slice(0, 3);
  const topUpcoming = data.upcomingDeadlines.slice(0, 4);
  const topSprint = data.sprintHealth.slice(0, 2);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Active Items" value={data.personalConsole?.activeCount || 0} />
        <StatCard label="Due Soon" value={data.personalConsole?.dueSoonCount || 0} tone="warn" />
        <StatCard label="Blocked" value={data.personalConsole?.blockedCount || 0} tone="danger" />
        <StatCard label="Review Queue" value={data.personalConsole?.reviewCount || 0} tone="success" />
      </section>

      <PersonalWorkConsole data={data.personalConsole} />

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="ds-kicker text-[11px] font-semibold">Team Pulse</p>
              <h2 className="ds-text mt-2 text-3xl font-black">Where the team needs attention</h2>
              <p className="ds-muted mt-3 max-w-xl text-sm leading-relaxed md:text-base">
                A narrower operational view of blockers, due-soon items, and work that should be pulled next.
              </p>
            </div>
            <div className="dashboard-summary-callout rounded-2xl px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] ds-muted">Recommended next move</p>
              <p className="ds-text mt-2 text-sm font-semibold leading-relaxed">
                {data.personalConsole?.recommendation || "Review your highest-impact item."}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="dashboard-summary-panel rounded-[1.4rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="ds-text text-sm font-bold uppercase tracking-[0.14em]">Focus pull</h3>
                <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">{topFocus.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {topFocus.map((task) => (
                  <div key={task._id} className="dashboard-summary-item rounded-2xl p-3">
                    <p className="ds-text text-sm font-semibold">{task.title}</p>
                    <p className="ds-muted mt-1 text-xs">{task.projectName}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge text={task.priority} tone="info" />
                      <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">{task.status}</span>
                    </div>
                  </div>
                ))}
                {topFocus.length === 0 ? <p className="ds-muted text-sm">No active focus items.</p> : null}
              </div>
            </div>

            <div className="dashboard-summary-panel rounded-[1.4rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="ds-text text-sm font-bold uppercase tracking-[0.14em]">Needs attention</h3>
                <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">{topBlocked.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {topBlocked.map((task) => (
                  <div key={task._id} className="dashboard-summary-item rounded-2xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="ds-text text-sm font-semibold">{task.title}</p>
                      <Badge text="Blocked" tone="high" />
                    </div>
                    <p className="ds-muted mt-2 text-xs">
                      {task.dependencyTaskIds?.length || 0} open dependencies
                      {task.dueDate ? ` | due ${formatDate(task.dueDate)}` : ""}
                    </p>
                  </div>
                ))}
                {topBlocked.length === 0 ? <p className="ds-muted text-sm">No blocked tasks right now.</p> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ds-kicker text-[11px] font-semibold">Delivery Snapshot</p>
              <h2 className="ds-text mt-2 text-3xl font-black">Cross-project view</h2>
            </div>
            <span className="settings-pill rounded-full px-3 py-1 text-xs font-semibold">compact digest</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="dashboard-summary-item rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] ds-muted">Project progress</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">{data.projectProgress}%</p>
            </div>
            <div className="dashboard-summary-item rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] ds-muted">Completed this week</p>
              <p className="ds-text mt-2 text-3xl font-black">{data.completedThisWeek}</p>
            </div>
            <div className="dashboard-summary-item rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] ds-muted">Overdue tasks</p>
              <p className="mt-2 text-3xl font-black text-rose-600">{data.overdueTasks.length}</p>
            </div>
            <div className="dashboard-summary-item rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] ds-muted">Upcoming deadlines</p>
              <p className="mt-2 text-3xl font-black text-amber-600">{topUpcoming.length}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
            <div className="dashboard-summary-panel rounded-[1.4rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="ds-text text-sm font-bold uppercase tracking-[0.14em]">Upcoming deadlines</h3>
                <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">
                  {topUpcoming.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {topUpcoming.map((task) => (
                  <div key={task._id} className="dashboard-summary-item rounded-2xl p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="ds-text text-sm font-semibold">{task.title}</p>
                        <p className="ds-muted mt-1 text-xs">Due {formatDate(task.dueDate)}</p>
                      </div>
                      <Badge text={task.priority} tone="info" />
                    </div>
                  </div>
                ))}
                {topUpcoming.length === 0 ? <p className="ds-muted text-sm">No upcoming deadlines.</p> : null}
              </div>
            </div>

            <div className="dashboard-summary-panel rounded-[1.4rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="ds-text text-sm font-bold uppercase tracking-[0.14em]">Sprint health</h3>
                <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">
                  {data.sprintHealth.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {topSprint.map((sprint) => (
                  <div key={sprint.sprintId} className="dashboard-summary-item rounded-2xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="ds-text text-sm font-semibold">{sprint.name}</p>
                      <Badge
                        text={sprint.confidence}
                        tone={sprint.confidence === "At risk" ? "high" : sprint.confidence === "Watch" ? "medium" : "low"}
                      />
                    </div>
                    <p className="ds-muted mt-2 text-xs">
                      {sprint.completedPoints}/{sprint.totalPoints} points complete | {sprint.blockedTasks} blocked
                    </p>
                  </div>
                ))}
                {topSprint.length === 0 ? <p className="ds-muted text-sm">No active sprint yet.</p> : null}
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default DashboardPage;
