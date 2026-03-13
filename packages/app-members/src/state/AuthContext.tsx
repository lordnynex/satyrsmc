import { createContext, use, useState, useCallback, useEffect, type ReactNode } from "react";
import { trpc } from "@/trpc";
import { UserType } from "@satyrsmc/shared/client";
import type { AuthUser } from "@satyrsmc/shared/dto/auth";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

interface AuthActions {
  login: (username: string, password: string, recaptchaToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const refreshMutation = trpc.auth.refresh.useMutation();

  // On mount, try to get the current user via the /me endpoint
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (meQuery.isSuccess) {
      setUser(meQuery.data);
      setIsLoading(false);
    } else if (meQuery.isError) {
      setUser(null);
      setIsLoading(false);
    }
  }, [meQuery.isSuccess, meQuery.isError, meQuery.data]);

  const login = useCallback(
    async (username: string, password: string, recaptchaToken: string) => {
      const result = await loginMutation.mutateAsync({
        username,
        password,
        recaptcha_token: recaptchaToken,
      });
      setUser(result.user);
      await utils.auth.me.invalidate();
    },
    [loginMutation, utils],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
    await utils.invalidate();
  }, [logoutMutation, utils]);

  const refresh = useCallback(async () => {
    try {
      const result = await refreshMutation.mutateAsync();
      setUser(result.user);
    } catch {
      setUser(null);
    }
  }, [refreshMutation]);

  const isAuthenticated = user !== null;
  const isAdmin =
    isAuthenticated && (user.user_type === UserType.Admin || user.user_type === UserType.Webmaster);
  const isMember = isAuthenticated && (user.is_member || isAdmin);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isMember,
    login,
    logout,
    refresh,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
