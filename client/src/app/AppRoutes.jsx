import { Navigate, Route, Routes } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import ProjectsPage from "../pages/ProjectsPage";
import ProjectWorkspacePage from "../pages/ProjectWorkspacePage";
import AnalyticsPage from "../pages/AnalyticsPage";
import NotificationsPage from "../pages/NotificationsPage";
import SettingsPage from "../pages/SettingsPage";
import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";
import LoadingState from "../components/common/LoadingState";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingState label="Loading account" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const GuestOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingState label="Loading" />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route
      path="/login"
      element={(
        <GuestOnlyRoute>
          <AuthLayout title="Welcome back">
            <LoginPage />
          </AuthLayout>
        </GuestOnlyRoute>
      )}
    />
    <Route
      path="/register"
      element={(
        <GuestOnlyRoute>
          <AuthLayout title="Create account">
            <RegisterPage />
          </AuthLayout>
        </GuestOnlyRoute>
      )}
    />
    <Route
      path="/dashboard"
      element={(
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      )}
    />
    <Route
      path="/projects"
      element={(
        <ProtectedRoute>
          <AppLayout>
            <ProjectsPage />
          </AppLayout>
        </ProtectedRoute>
      )}
    />
    <Route
      path="/projects/:projectId"
      element={(
        <ProtectedRoute>
          <AppLayout>
            <ProjectWorkspacePage />
          </AppLayout>
        </ProtectedRoute>
      )}
    />
    <Route
      path="/analytics"
      element={(
        <ProtectedRoute>
          <AppLayout>
            <AnalyticsPage />
          </AppLayout>
        </ProtectedRoute>
      )}
    />
    <Route
      path="/notifications"
      element={(
        <ProtectedRoute>
          <AppLayout>
            <NotificationsPage />
          </AppLayout>
        </ProtectedRoute>
      )}
    />
    <Route
      path="/settings"
      element={(
        <ProtectedRoute>
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        </ProtectedRoute>
      )}
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
