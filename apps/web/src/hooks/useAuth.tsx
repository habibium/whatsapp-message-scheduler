import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, type User } from "../lib/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const result = await api.auth.me();
    if (result.success) {
      setUser(result.data);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email: string, password: string): Promise<string | null> => {
    const result = await api.auth.login(email, password);
    if (result.success) {
      setUser(result.data);
      return null;
    }
    return result.error;
  };

  const register = async (email: string, password: string): Promise<string | null> => {
    const result = await api.auth.register(email, password);
    if (result.success) {
      setUser(result.data);
      return null;
    }
    return result.error;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
