import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsApi } from "../api/analyticsApi";
import StatCard from "../components/dashboard/StatCard";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import Badge from "../components/common/Badge";
import { formatDate } from "../utils/helpers";

const quickActions = [
  { label: "Review blockers", hint: "Prioritize stuck work" },
  { label: "Check sprint health", hint: "Look for at-risk velocity" },
  { label: "Balance workload", hint: "Spot overloaded teammates" },
];

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
  const topFocus = data.standup.myFocus.slice(0, 4);
  const topBlocked = data.standup.blockedTasks.slice(0, 4);
  const topReview = data.standup.reviewQueue.slice(0, 4);
  const topUpcoming = data.upcomingDeadlines.slice(0, 5);

  return (
    <div className="space-y-5">
      <section className="card overflow-hidden p-0">
        <div className="dashboard-hero-grid">
          <div className="dashboard-hero-main p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Standup mode</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">Daily team pulse</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
                  A wider operational view of what deserves attention now: focus items, blockers, review work, due dates, and team balance.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <div key={action.label} className="rounded-full border border-white/75 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                    {action.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.8fr]">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">My focus</p>
                <div className="mt-3 space-y-2.5">
                  {topFocus.map((task, index) => (
                    <div key={task._id} className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3 transition hover:-translate-y-0.5 hover:shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{task.title}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{task.status}</p>
                    </div>
                  ))}
                  {topFocus.length === 0 && <p className="text-sm text-slate-500">No active focus items.</p>}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Needs attention</p>
                <div className="mt-3 space-y-2.5">
                  {topBlocked.map((task) => (
                    <div key={task._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/90 px-3 py-3 transition hover:-translate-y-0.5 hover:shadow-sm">
                      <div>
                        <p className="text-sm font-semibold">{task.title}</p>
                        <p className="mt-1 text-xs text-slate-500">Dependency or progress issue</p>
                      </div>
                      <Badge text="Blocked" tone="high" />
                    </div>
                  ))}
                  {topBlocked.length === 0 && <p className="text-sm text-slate-500">No blocked tasks.</p>}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Today</p>
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/85 p-3">
                    <p className="text-sm font-semibold">Review queue</p>
                    <p className="mt-1 text-4xl font-black text-slate-900">{data.standup.reviewQueue.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/85 p-3">
                    <p className="text-sm font-semibold">Due today</p>
                    <p className="mt-1 text-4xl font-black text-amber-600">{data.standup.dueToday.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/85 p-3">
                    <p className="text-sm font-semibold">Shipped this week</p>
                    <p className="mt-1 text-4xl font-black text-emerald-600">{data.standup.shippedRecently.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-hero-rail p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Review lane</p>
            <div className="mt-3 space-y-2.5">
              {topReview.map((task) => (
                <div key={task._id} className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{task.title}</p>
                    <Badge text="Review" tone="info" />
                  </div>
                </div>
              ))}
              {topReview.length === 0 && <p className="text-sm text-slate-500">No review items waiting.</p>}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Delivery tempo</p>
              <div className="mt-3 space-y-3">
                {[
                  { label: "Upcoming deadlines", value: data.upcomingDeadlines.length, tone: "text-amber-600" },
                  { label: "Overdue tasks", value: data.overdueTasks.length, tone: "text-rose-600" },
                  { label: "Active sprint checks", value: data.sprintHealth.length, tone: "text-teal-700" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                    <p className={`mt-2 text-2xl font-black ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Project Progress" value={`${data.projectProgress}%`} tone="success" />
        <StatCard label="Completed This Week" value={data.completedThisWeek} />
        <StatCard label="Overdue Tasks" value={data.overdueTasks.length} tone="danger" />
        <StatCard label="Upcoming Deadlines" value={data.upcomingDeadlines.length} tone="warn" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Upcoming deadlines</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              next 5 items
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {topUpcoming.map((task) => (
              <div key={task._id} className="rounded-2xl border border-slate-200 p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">Delivery checkpoint</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge text={task.priority} tone="info" />
                    <p className="text-xs text-slate-500">{formatDate(task.dueDate)}</p>
                  </div>
                </div>
              </div>
            ))}
            {topUpcoming.length === 0 && <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Workload balancing</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              team distribution
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {data.workloadDistribution.map((row) => (
              <div key={row.userId} className="rounded-2xl border border-slate-200 p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{row.name}</p>
                  <Badge
                    text={row.balanceState}
                    tone={
                      row.balanceState === "overloaded"
                        ? "high"
                        : row.balanceState === "balanced"
                          ? "medium"
                          : "low"
                    }
                  />
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${
                      row.balanceState === "overloaded"
                        ? "bg-rose-500"
                        : row.balanceState === "balanced"
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(Math.max(row.score * 4, 12), 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">{row.activeTasks} active tasks | score {row.score}</p>
              </div>
            ))}
            {data.workloadDistribution.length === 0 && <p className="text-sm text-slate-500">No assignees yet.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Standup checklist</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              daily scan
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {data.standup.reviewQueue.map((task) => (
              <div key={task._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
                <p className="text-sm font-semibold">{task.title}</p>
                <Badge text="Review" tone="info" />
              </div>
            ))}
            {data.standup.dueToday.map((task) => (
              <div key={task._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
                <p className="text-sm font-semibold">{task.title}</p>
                <p className="text-xs text-slate-500">{formatDate(task.dueDate)}</p>
              </div>
            ))}
            {data.standup.reviewQueue.length === 0 && data.standup.dueToday.length === 0 && (
              <p className="text-sm text-slate-500">The board is calm right now.</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Active sprint health</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              confidence check
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {data.sprintHealth.map((sprint) => (
              <div key={sprint.sprintId} className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{sprint.name}</p>
                  <Badge
                    text={sprint.confidence}
                    tone={sprint.confidence === "At risk" ? "high" : sprint.confidence === "Watch" ? "medium" : "low"}
                  />
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${
                      sprint.confidence === "At risk"
                        ? "bg-rose-500"
                        : sprint.confidence === "Watch"
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${sprint.totalPoints > 0 ? Math.min((sprint.completedPoints / sprint.totalPoints) * 100, 100) : 8}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {sprint.completedPoints}/{sprint.totalPoints} points complete | {sprint.blockedTasks} blocked
                </p>
              </div>
            ))}
            {data.sprintHealth.length === 0 && <p className="text-sm text-slate-500">No active sprint yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
