import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuroraBackground from "../components/common/AuroraBackground";
import taskSphereLogo from "../assets/task-sphere-logo.png";

const tiles = [
  {
    title: "Kanban + Sprint Rhythm",
    text: "Plan in backlog, execute in sprint, and track flow without switching tools.",
  },
  {
    title: "Role-Safe Collaboration",
    text: "Built-in permission guardrails for PM, Team Lead, members, and viewers.",
  },
  {
    title: "Realtime Team Pulse",
    text: "Live updates for task movement, notifications, and team activity.",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <AuroraBackground />
      <div className="mx-auto max-w-6xl space-y-5">
        <motion.header
          className="card overflow-hidden p-5 md:p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--outline)] pb-5">
            <div className="flex items-center gap-3.5">
              <div className="brand-logo-frame h-11 w-40">
                <img src={taskSphereLogo} alt="Task Sphere logo" className="brand-logo-image" />
              </div>
              <div>
                <p className="ds-kicker text-[10px] font-semibold">Software Engineering Project</p>
                <p className="ds-text text-sm font-semibold">Task Sphere</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Link className="ds-btn-secondary rounded-xl px-4 py-2 text-sm font-semibold" to="/login">
                Open Workspace
              </Link>
              <Link className="ds-btn-primary rounded-xl px-4 py-2 text-sm font-semibold" to="/register">
                Start Building
              </Link>
            </div>
          </div>

          <div className="landing-grid mt-7">
            <div>
              <p className="ds-kicker text-[11px] font-semibold">Plan, Execute, Ship</p>
              <h1 className="ds-text mt-3 max-w-3xl text-4xl font-black leading-[1.05] md:text-6xl">
                Your Team,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-sky-500">
                  One Execution Surface
                </span>
              </h1>
              <p className="ds-muted mt-5 max-w-2xl text-lg leading-relaxed">
                Task Sphere brings planning, sprint execution, and delivery insights into one clean command center for student engineering teams.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {tiles.map((tile, index) => (
                  <motion.div
                    key={tile.title}
                    className="feature-tile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.08 * index }}
                  >
                    <p className="ds-text text-sm font-semibold">{tile.title}</p>
                    <p className="ds-muted mt-1 text-xs">{tile.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              className="card relative p-4 md:p-5"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
            >
              <p className="ds-kicker text-[10px] font-semibold">How It Works</p>
              <h2 className="ds-text mt-2 text-xl font-bold leading-tight">Built for assignment-heavy semesters</h2>
              <div className="mt-4 space-y-3.5">
                <div className="rounded-xl border border-[var(--outline)] bg-[var(--soft-surface)] p-3">
                  <p className="text-sm font-semibold">1. Organize team work</p>
                  <p className="ds-muted mt-1 text-xs">
                    Create projects, define roles, and break work into tasks, bugs, and stories.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--outline)] bg-[var(--soft-surface)] p-3">
                    <p className="text-sm font-semibold">2. Execute in sprints</p>
                    <p className="ds-muted mt-1 text-xs">
                      Run sprint cycles with capacity, burndown, and dependency-safe delivery.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--outline)] bg-[var(--soft-surface)] p-3">
                    <p className="text-sm font-semibold">3. Track outcomes</p>
                    <p className="ds-muted mt-1 text-xs">
                      Monitor progress, workload balance, and alerts from one analytics view.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.header>
      </div>
    </div>
  );
};

export default LandingPage;
