const SCOPE_OPTIONS = [
  { value: "my", label: "My Work" },
  { value: "team", label: "Team" },
  { value: "project", label: "Project" },
];

const AnalyticsScopeBar = ({
  scope,
  onScopeChange,
  teams = [],
  projects = [],
  selectedTeam,
  onTeamChange,
  selectedProject,
  onProjectChange,
  helperText = "",
}) => (
  <section className="card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="ds-kicker text-[11px] font-semibold">Analytics Scope</p>
        <h2 className="ds-text mt-2 text-lg font-bold">Choose the data lens</h2>
        {helperText ? <p className="ds-muted mt-1 text-sm">{helperText}</p> : null}
      </div>
      <div className="workspace-tabs">
        {SCOPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`workspace-tab ${scope === option.value ? "workspace-tab-active" : ""}`}
            onClick={() => onScopeChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>

    {(scope === "team" || scope === "project") ? (
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select className="rounded-xl border border-slate-300 px-3 py-2" value={selectedTeam} onChange={(e) => onTeamChange(e.target.value)}>
          <option value="">Select team</option>
          {teams.map((team) => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>

        {scope === "project" ? (
          <select className="rounded-xl border border-slate-300 px-3 py-2" value={selectedProject} onChange={(e) => onProjectChange(e.target.value)}>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-500">
            Team scope aggregates only the selected team’s projects.
          </div>
        )}
      </div>
    ) : null}
  </section>
);

export default AnalyticsScopeBar;
