"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, signIn as signInRequest, signOut as signOutRequest, signUp as signUpRequest } from "@/lib/auth-client";
import type { User } from "@/lib/auth-types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await signInRequest({ email, password }));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setUser(await signUpRequest({ email, password }));
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
