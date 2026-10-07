import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, tokenStore } from "@/lib/api";
import type { Session, User } from "@/types/api";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = tokenStore.getAccessToken();
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    api
      .me()
      .then(setUser)
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const applySession = (session: Session) => {
    tokenStore.setSession(session);
    setUser(session.user);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (input) => {
        const session = await api.login(input);
        applySession(session);
        toast.success("Signed in");
      },
      register: async (input) => {
        const session = await api.register(input);
        applySession(session);
        toast.success("Account created");
      },
      logout: () => {
        tokenStore.clear();
        setUser(null);
        toast.message("Signed out");
      }
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
