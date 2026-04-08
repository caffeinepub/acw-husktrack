import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { AppUser } from "./useAuth";
import { useAuth } from "./useAuth";

interface AuthContextValue {
  user: AppUser | null;
  pin: string;
  isAdmin: boolean;
  login: (username: string, pin: string) => Promise<void>;
  logout: () => void;
  updateStoredPin: (newPin: string) => void;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  pin: "",
  isAdmin: false,
  login: async () => {},
  logout: () => {},
  updateStoredPin: () => {},
  isLoading: false,
  error: null,
  isInitialized: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    pin,
    login,
    logout,
    updateStoredPin,
    isLoading,
    error,
    isInitialized,
  } = useAuth();
  return (
    <AuthContext.Provider
      value={{
        user,
        pin,
        isAdmin: user?.role === "admin",
        login,
        logout,
        updateStoredPin,
        isLoading,
        error,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
