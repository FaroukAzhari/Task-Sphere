import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsApi } from "../api/analyticsApi";
import StatCard from "../components/dashboard/StatCard";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import Badge from "../components/common/Badge";
import { formatDate } from "../utils/helpers";

const DashboardPage = () => {
  const analyticsQuery = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: () => fetchAnalyticsApi({}),
  });

  if (analyticsQuery.isLoading) return <LoadingState label="Loading dashboard" />;
  if (analyticsQuery.isError) return <EmptyState title="Analytics unavailable" description="Create a project and tasks to see dashboard metrics." />;

  const data = analyticsQuery.data;

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-[linear-gradient(135deg,#ecfeff,#f8fafc_55%,#fef3c7)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Standup mode</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Daily team pulse</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">My focus</p>
                <div className="mt-2 space-y-2">
                  {data.standup.myFocus.map((task) => (
                    <div key={task._id} className="rounded-xl border border-slate-200 px-3 py-2">
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.status}</p>
                    </div>
                  ))}
                  {data.standup.myFocus.length === 0 && <p className="text-sm text-slate-500">No active focus items.</p>}
                </div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Needs attention</p>
                <div className="mt-2 space-y-2">
                  {data.standup.blockedTasks.slice(0, 3).map((task) => (
                    <div key={task._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                      <p className="text-sm font-semibold">{task.title}</p>
                      <Badge text="Blocked" tone="high" />
                    </div>
                  ))}
                  {data.standup.blockedTasks.length === 0 && <p className="text-sm text-slate-500">No blocked tasks.</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Today</p>
            <div className="mt-3 grid gap-3">
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-sm font-semibold">Review queue</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{data.standup.reviewQueue.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-sm font-semibold">Due today</p>
                <p className="mt-1 text-3xl font-black text-amber-600">{data.standup.dueToday.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <p className="text-sm font-semibold">Shipped this week</p>
                <p className="mt-1 text-3xl font-black text-emerald-600">{data.standup.shippedRecently.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Project Progress" value={`${data.projectProgress}%`} tone="success" />
        <StatCard label="Completed This Week" value={data.completedThisWeek} />
        <StatCard label="Overdue Tasks" value={data.overdueTasks.length} tone="danger" />
        <StatCard label="Upcoming Deadlines" value={data.upcomingDeadlines.length} tone="warn" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-lg font-semibold">Upcoming deadlines</h2>
          <div className="mt-3 space-y-2">
            {data.upcomingDeadlines.slice(0, 6).map((task) => (
              <div key={task._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                <p className="text-sm font-medium">{task.title}</p>
                <div className="flex items-center gap-2">
                  <Badge text={task.priority} tone="info" />
                  <p className="text-xs text-slate-500">{formatDate(task.dueDate)}</p>
                </div>
              </div>
            ))}
            {data.upcomingDeadlines.length === 0 && <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold">Workload balancing</h2>
          <div className="mt-3 space-y-2">
            {data.workloadDistribution.map((row) => (
              <div key={row.userId} className="rounded-lg border border-slate-200 p-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{row.name}</p>
                  <Badge text={row.balanceState} tone={row.balanceState === "overloaded" ? "high" : row.balanceState === "balanced" ? "medium" : "low"} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{row.activeTasks} active tasks | score {row.score}</p>
              </div>
            ))}
            {data.workloadDistribution.length === 0 && <p className="text-sm text-slate-500">No assignees yet.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-lg font-semibold">Standup checklist</h2>
          <div className="mt-3 space-y-2">
            {data.standup.reviewQueue.map((task) => (
              <div key={task._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-sm font-semibold">{task.title}</p>
                <Badge text="Review" tone="info" />
              </div>
            ))}
            {data.standup.dueToday.map((task) => (
              <div key={task._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-sm font-semibold">{task.title}</p>
                <p className="text-xs text-slate-500">{formatDate(task.dueDate)}</p>
              </div>
            ))}
            {data.standup.reviewQueue.length === 0 && data.standup.dueToday.length === 0 && <p className="text-sm text-slate-500">The board is calm right now.</p>}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold">Active sprint health</h2>
          <div className="mt-3 space-y-2">
            {data.sprintHealth.map((sprint) => (
              <div key={sprint.sprintId} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{sprint.name}</p>
                  <Badge text={sprint.confidence} tone={sprint.confidence === "At risk" ? "high" : sprint.confidence === "Watch" ? "medium" : "low"} />
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
