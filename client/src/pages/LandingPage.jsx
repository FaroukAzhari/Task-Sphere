import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuroraBackground from "../components/common/AuroraBackground";
import taskSphereLogo from "../assets/task-sphere-logo.png";

const featureTiles = [
  {
    title: "Kanban + Sprint Rhythm",
    text: "Plan, move, and review work in one clean flow.",
  },
  {
    title: "Role-Safe Collaboration",
    text: "Keep responsibilities clear across every team role.",
  },
  {
    title: "Realtime Team Pulse",
    text: "Stay aligned with live updates and shared visibility.",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <AuroraBackground />
      <div className="mx-auto w-full max-w-[96rem]">
        <motion.section
          className="card overflow-hidden px-5 py-5 md:px-8 md:py-7 xl:px-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--outline)] pb-5">
            <div className="flex items-center gap-4">
              <div className="brand-logo-frame h-12 w-40">
                <img src={taskSphereLogo} alt="Task Sphere logo" className="brand-logo-image" />
              </div>
              <div>
                <p className="ds-kicker text-[10px] font-semibold">Software Engineering Project</p>
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

          <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_22rem] xl:items-start">
            <div className="max-w-4xl">
              <p className="ds-kicker text-[11px] font-semibold">Plan, Execute, Ship</p>
              <h1 className="ds-text mt-3 text-5xl font-black leading-[0.98] md:text-7xl">
                Full-team delivery
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-sky-500">
                  without the clutter.
                </span>
              </h1>
              <p className="ds-muted mt-5 max-w-3xl text-xl leading-relaxed">
                Task Sphere gives student engineering teams one shared command surface for sprint planning, execution, blockers, deadlines, and outcomes.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
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
            </div>

            <motion.div
              className="hero-panel p-5"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
            >
              <p className="ds-kicker text-[20px] font-semibold">Built For</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Student engineering teams</h2>
              <p className="ds-muted mt-3 text-sm leading-relaxed">
                A simple workspace for team projects, sprint-based delivery, and shared visibility across the semester.
              </p>
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
