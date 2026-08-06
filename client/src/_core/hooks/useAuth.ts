import { useEffect, useState } from "react";
import { trpc } from "../../lib/trpc";

export interface User {
  id: number;
  openId: string;
  name?: string;
  email?: string;
  role: "user" | "admin";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Query current user from backend
  const { data: currentUser, isLoading: queryLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!queryLoading) {
      if (currentUser) {
        setUser(currentUser as User);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [currentUser, queryLoading]);

  const startLogin = () => {
    // Redirect to Manus OAuth login
    const loginUrl = `${process.env.VITE_OAUTH_PORTAL_URL}/login?redirect=${encodeURIComponent(window.location.href)}`;
    window.location.href = loginUrl;
  };

  const logout = async () => {
    try {
      const logoutMutation = trpc.auth.logout.useMutation();
      await logoutMutation.mutateAsync();
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    startLogin,
    logout,
  };
}
