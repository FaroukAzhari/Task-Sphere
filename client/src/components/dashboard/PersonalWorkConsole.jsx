import Badge from "../common/Badge";
import { formatDate } from "../../utils/helpers";

const queueGroups = [
  { key: "focusQueue", title: "Focus queue", empty: "No active work assigned." },
  { key: "blockedItems", title: "Waiting on others", empty: "Nothing blocked right now." },
  { key: "reviewItems", title: "Ready for review", empty: "No review items in your queue." },
  { key: "recentWins", title: "Recent wins", empty: "No completed items this week yet." },
];

const PersonalWorkConsole = ({ data }) => {
  if (!data) return null;

  return (
    <section className="card overflow-hidden p-0">
      <div className="personal-console-shell">
        <div className="personal-console-head p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="ds-kicker text-[11px] font-semibold">Personal Work Console</p>
              <h2 className="ds-text mt-2 text-3xl font-black tracking-tight">Your operating lane</h2>
              <p className="ds-muted mt-3 max-w-xl text-sm leading-relaxed md:text-base">
                A focused view of what needs your attention now: due-soon items, blockers, review work, and recently shipped tasks.
              </p>
            </div>
            <div className="personal-console-callout rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] ds-muted">Recommended next move</p>
              <p className="ds-text mt-2 text-sm font-semibold leading-relaxed">{data.recommendation}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Active items", value: data.activeCount, tone: "text-slate-900" },
              { label: "Due soon", value: data.dueSoonCount, tone: "text-amber-600" },
              { label: "Blocked", value: data.blockedCount, tone: "text-rose-600" },
              { label: "Review queue", value: data.reviewCount, tone: "text-teal-700" },
            ].map((item) => (
              <div key={item.label} className="personal-console-stat rounded-2xl p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] ds-muted">{item.label}</p>
                <p className={`mt-2 text-3xl font-black ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-px personal-console-grid">
          {queueGroups.map((group) => (
            <div key={group.key} className="personal-console-column p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="ds-text text-sm font-bold uppercase tracking-[0.14em]">{group.title}</h3>
                <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">
                  {(data[group.key] || []).length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {(data[group.key] || []).map((item) => (
                  <div key={item._id} className="personal-console-item rounded-2xl p-3">
                    <p className="ds-text text-sm font-semibold">{item.title}</p>
                    <p className="ds-muted mt-1 text-xs">{item.projectName}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {"priority" in item && item.priority ? <Badge text={item.priority} tone="info" /> : null}
                      {"blocked" in item && item.blocked ? <Badge text="Blocked" tone="high" /> : null}
                      {"status" in item && item.status ? (
                        <span className="settings-pill rounded-full px-2 py-1 text-[11px] font-semibold">
                          {item.status}
                        </span>
                      ) : null}
                      {item.dueDate ? (
                        <span className="ds-muted text-[11px] font-semibold">Due {formatDate(item.dueDate)}</span>
                      ) : null}
                      {item.completedAt ? (
                        <span className="ds-muted text-[11px] font-semibold">Done {formatDate(item.completedAt)}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
                {(data[group.key] || []).length === 0 ? (
                  <p className="ds-muted text-sm">{group.empty}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PersonalWorkConsole;
