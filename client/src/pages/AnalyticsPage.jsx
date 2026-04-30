import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import { fetchAnalyticsApi } from "../api/analyticsApi";
import LoadingState from "../components/common/LoadingState";

const AnalyticsPage = () => {
  const query = useQuery({
    queryKey: ["analytics-page"],
    queryFn: () => fetchAnalyticsApi({}),
  });

  if (query.isLoading) return <LoadingState label="Loading analytics" />;
  if (query.isError) return <p className="card p-4 text-sm text-slate-500">Analytics unavailable.</p>;

  const data = query.data;
  const pieColors = ["#0f766e", "#22c55e", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-3">
        {data.sprintHealth.slice(0, 3).map((sprint) => (
          <div key={sprint.sprintId} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">{sprint.status}</p>
            <h2 className="mt-2 text-lg font-bold">{sprint.name}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Completion</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{sprint.completionRatio}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Time elapsed</p>
                <p className="mt-1 text-2xl font-black text-amber-600">{sprint.timeElapsedRatio}%</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {sprint.completedPoints}/{sprint.totalPoints} points done, {sprint.blockedTasks} blocked.
            </p>
          </div>
        ))}
        {data.sprintHealth.length === 0 && <div className="card p-4 text-sm text-slate-500">No active sprint health data yet.</div>}
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Completion trends (7 days)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.completionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#0f766e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-lg font-semibold">Workload distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workloadDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="activeTasks" fill="#0f766e" />
                <Bar dataKey="score" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold">Priority distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.priorityDistribution} dataKey="count" nameKey="priority" outerRadius={100} label>
                  {data.priorityDistribution.map((entry, index) => (
                    <Cell key={entry.priority} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-lg font-semibold">Sprint health table</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2 pr-3">Sprint</th>
                <th className="pb-2 pr-3">Confidence</th>
                <th className="pb-2 pr-3">Scope</th>
                <th className="pb-2 pr-3">Blocked</th>
                <th className="pb-2 pr-3">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {data.sprintHealth.map((sprint) => (
                <tr key={sprint.sprintId} className="border-t border-slate-200">
                  <td className="py-3 pr-3 font-semibold">{sprint.name}</td>
                  <td className="py-3 pr-3">{sprint.confidence}</td>
                  <td className="py-3 pr-3">{sprint.scopeCount}</td>
                  <td className="py-3 pr-3">{sprint.blockedTasks}</td>
                  <td className="py-3 pr-3">{sprint.remainingPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.sprintHealth.length === 0 && <p className="text-sm text-slate-500">No sprint rows yet.</p>}
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
