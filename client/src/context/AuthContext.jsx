import { createContext, useEffect, useMemo, useState } from "react";
import { meApi } from "../api/authApi";

export const AuthContext = createContext(null);

const TOKEN_KEY = "task_sphere_token";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const payload = await meApi();
        setUser(payload);
      } catch (_error) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const login = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(token && user), login, logout, updateUser }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
