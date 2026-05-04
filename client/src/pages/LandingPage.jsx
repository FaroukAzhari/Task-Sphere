import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuroraBackground from "../components/common/AuroraBackground";
import taskSphereLogo from "../assets/task-sphere-logo.png";

const featureTiles = [
  {
    title: "Board, Timeline, and Hub in one workspace",
    text: "Move between execution, delivery planning, and project communication without losing the thread of the work.",
  },
  {
    title: "Role-safe collaboration for student teams",
    text: "Project managers, team leads, members, and viewers each get the right level of control without muddying responsibility.",
  },
  {
    title: "Realtime updates with delivery awareness",
    text: "Track deadlines, dependency pressure, sprint health, and team notifications from a single operating surface.",
  },
];

const spotlightStats = [
  { label: "Workspace Modes", value: "Board · Timeline · Hub" },
  { label: "Planning Layer", value: "Sprint + Risk Signals" },
  { label: "Team Coordination", value: "Invites + Notifications" },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <AuroraBackground />
      <div className="mx-auto w-full max-w-[96rem]">
        <motion.section
          className="card landing-hero-shell overflow-hidden px-5 py-5 md:px-8 md:py-7 xl:px-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--outline)] pb-5">
            <div className="flex items-center gap-4">
              <div className="brand-logo-frame h-12 w-40">
                <img src={taskSphereLogo} alt="Task Sphere logo" className="brand-logo-image" />
              </div>
              <div>
                <p className="ds-kicker text-[10px] font-semibold">Software Engineering Workspace</p>
                <p className="ds-text text-base font-semibold">Task Sphere</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link className="ds-btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold" to="/login">
                Open Workspace
              </Link>
              <Link className="ds-btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold" to="/register">
                Start Building
              </Link>
            </div>
          </div>

          <div className="landing-showcase mt-8">
            <div className="max-w-4xl">
              <p className="ds-kicker text-[11px] font-semibold">Plan. Coordinate. Deliver.</p>
              <h1 className="ds-text mt-3 text-5xl font-black leading-[0.95] md:text-7xl">
                Project control
                <span className="landing-gradient-copy block">with a cleaner operating surface.</span>
              </h1>
              <p className="ds-muted mt-5 max-w-3xl text-lg leading-relaxed md:text-xl">
                Task Sphere gives student engineering teams a sharper command space for structured planning, sprint execution,
                delivery visibility, and role-safe collaboration.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link className="ds-btn-primary rounded-2xl px-5 py-3 text-sm font-semibold" to="/register">
                    Create your workspace
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link className="ds-btn-secondary rounded-2xl px-5 py-3 text-sm font-semibold" to="/login">
                    Sign in to continue
                  </Link>
                </motion.div>
              </div>

              <div className="landing-stat-row mt-8">
                {spotlightStats.map((item, index) => (
                  <motion.div
                    key={item.label}
                    className="landing-stat-card"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.08 * index }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] ds-muted">{item.label}</p>
                    <p className="ds-text mt-2 text-lg font-black">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              className="landing-command-stage"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
            >
              <div className="landing-glow-ring landing-glow-ring-a" />
              <div className="landing-glow-ring landing-glow-ring-b" />
              <div className="landing-command-card">
                <div className="landing-command-head">
                  <div>
                    <p className="ds-kicker text-[10px] font-semibold">Workspace Preview</p>
                    <h2 className="ds-text mt-2 text-2xl font-black">A calmer control room</h2>
                  </div>
                  <span className="landing-command-pill">Preview</span>
                </div>

                <div className="landing-command-grid">
                  <div className="landing-mini-panel">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] ds-muted">Team lane</p>
                    <p className="ds-text mt-3 text-lg font-black">Focused work surface</p>
                    <p className="ds-muted mt-1 text-sm">Keep active work, review items, and blockers easy to scan.</p>
                  </div>
                  <div className="landing-mini-panel">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] ds-muted">Project hub</p>
                    <p className="mt-3 text-lg font-black text-teal-700">Shared updates and docs</p>
                    <p className="ds-muted mt-1 text-sm">Store context, decisions, links, and team communication together.</p>
                  </div>
                  <div className="landing-mini-panel landing-mini-panel-wide">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] ds-muted">Navigation modes</p>
                    <div className="landing-roadline mt-4">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="landing-command-pill">Board</span>
                      <span className="landing-command-pill">Timeline</span>
                      <span className="landing-command-pill">Hub</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-10 grid gap-3 lg:grid-cols-3">
            {featureTiles.map((tile, index) => (
              <motion.div
                key={tile.title}
                className="feature-tile p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.08 * index }}
              >
                <p className="ds-text text-base font-semibold">{tile.title}</p>
                <p className="ds-muted mt-2 text-sm leading-relaxed">{tile.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default LandingPage;
