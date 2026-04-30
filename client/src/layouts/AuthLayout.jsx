import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuroraBackground from "../components/common/AuroraBackground";
import taskSphereLogo from "../assets/task-sphere-logo.png";

const AuthLayout = ({ title, children }) => {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <AuroraBackground />
      <motion.div
        className="card w-full max-w-md p-6"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3">
          <div className="brand-logo-frame h-10 w-32">
            <img src={taskSphereLogo} alt="Task Sphere logo" className="brand-logo-image" />
          </div>
          <p className="ds-kicker text-[10px] font-semibold">Task Sphere</p>
        </div>
        <h1 className="ds-text mt-2 text-2xl font-bold">{title}</h1>
        <div className="mt-6">{children}</div>
        <p className="ds-muted mt-5 text-center text-sm">
          <Link className="underline" to="/">
            Back to landing
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
