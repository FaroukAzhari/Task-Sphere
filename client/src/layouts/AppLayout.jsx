import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import useAuth from "../hooks/useAuth";
import AuroraBackground from "../components/common/AuroraBackground";
import { fetchNotificationsApi } from "../api/notificationApi";
import FonAiChat from "../components/ai/FonAiChat";
import taskSphereLogo from "../assets/task-sphere-logo.png";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/projects", label: "Projects" },
  { to: "/analytics", label: "Analytics" },
  { to: "/notifications", label: "Notifications" },
  { to: "/settings", label: "Settings" },
];

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("task_sphere_theme") || "light");
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotificationsApi,
    enabled: Boolean(user?._id),
  });

  useEffect(() => {
    const token = localStorage.getItem("task_sphere_token");
    if (!token) return undefined;

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", { auth: { token } });
    socket.on("notification:new", (notification) => {
      queryClient.setQueryData(["notifications"], (current = []) => [notification, ...current]);
    });

    return () => socket.disconnect();
  }, [queryClient]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("task_sphere_theme", theme);
  }, [theme]);

  const unreadCount = (notificationsQuery.data || []).filter((notification) => !notification.isRead).length;

  return (
    <div className="min-h-screen px-4 py-5 md:px-8">
      <AuroraBackground />
      <div className="mx-auto mb-4 flex w-full max-w-[96rem] items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="brand-logo-frame h-9 w-[7.5rem] md:h-10 md:w-32">
            <img src={taskSphereLogo} alt="Task Sphere logo" className="brand-logo-image" />
          </div>
          <p className="ds-kicker text-[10px] font-bold">Task Sphere</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            className="ds-btn-secondary rounded-lg px-3 py-2 text-xs font-semibold backdrop-blur"
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white md:hidden"
          >
            {menuOpen ? "Close menu" : "Open menu"}
          </button>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[96rem] gap-5 md:grid-cols-[17rem_1fr] xl:grid-cols-[18.5rem_1fr]">
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={`card p-4 backdrop-blur ${menuOpen ? "block" : "hidden md:block"}`}
        >
          <div className="flex items-center gap-2">
            <div className="brand-logo-frame h-9 w-28">
              <img src={taskSphereLogo} alt="Task Sphere logo" className="brand-logo-image" />
            </div>
            <p className="ds-kicker text-[10px] font-semibold">Task Sphere</p>
          </div>
          <h1 className="ds-text mt-2 text-xl font-bold">Team Workspace</h1>
          <nav className="mt-4 space-y-2">
            {links.map((link) => (
              <motion.div key={link.to} whileHover={{ x: 3 }}>
                <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive ? "ds-btn-primary text-white" : "ds-nav-link"
                  }`
                }
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{link.label}</span>
                  {link.to === "/notifications" && unreadCount > 0 ? (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </span>
              </NavLink>
              </motion.div>
            ))}
          </nav>
          <div className="ds-surface-soft mt-6 rounded-xl p-3">
            <div className="flex items-center gap-2">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="User avatar" className="h-9 w-9 rounded-full border border-slate-300 object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-xs font-semibold text-slate-700">
                  {(user?.name || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="ds-text text-sm font-semibold">{user?.name}</p>
                <p className="ds-muted text-xs">{user?.headline || user?.globalRole}</p>
              </div>
            </div>
            <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: user?.accentColor || "var(--primary)" }} />
            <button
              type="button"
              onClick={logout}
              className="ds-btn-secondary mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold"
            >
              Logout
            </button>
          </div>
        </motion.aside>
        <motion.main
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        >
          {children}
        </motion.main>
      </div>
      <FonAiChat />
    </div>
  );
};

export default AppLayout;
