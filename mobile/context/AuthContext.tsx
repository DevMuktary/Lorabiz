import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAuthToken,
  saveAuthToken,
  removeAuthToken,
  getAuthUser,
  saveAuthUser,
  removeAuthUser,
  isBiometricsEnabled,
  setBiometricsEnabled,
} from "../lib/storage";
import { api } from "../lib/api";
import { promptBiometricAuth, getBiometricCapabilities } from "../lib/biometrics";

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  phone?: string;
  role: string;
  image?: string | null;
  isProfileComplete?: boolean;
  twoFactorEnabled?: boolean;
  referralCode?: string | null;
  wallet?: {
    id: string;
    balance: number;
  };
}

interface LoginResult {
  success: boolean;
  requireOtp?: boolean;
  twoFactorMethod?: string;
  message?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  login: (email: string, password: string, otpCode?: string, isBackupCode?: boolean) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<boolean>;
  promptBiometricUnlock: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      // 1. Check biometrics hardware
      const caps = await getBiometricCapabilities();
      setBiometricAvailable(caps.hasHardware && caps.isEnrolled);

      const bioPref = await isBiometricsEnabled();
      setBiometricEnabledState(bioPref);

      // 2. Load stored token and user
      const storedToken = await getAuthToken();
      const storedUser = await getAuthUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        // Quiet background session validation & wallet refresh
        api
          .get("/api/auth/mobile/session")
          .then((res) => {
            if (res?.success && res.user) {
              setUser(res.user);
              saveAuthUser(res.user);
            }
          })
          .catch(() => {
            // Session expired or network error
          });
      }
    } catch (err) {
      console.error("Auth init error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(
    email: string,
    password: string,
    otpCode?: string,
    isBackupCode?: boolean
  ): Promise<LoginResult> {
    try {
      const res = await api.post(
        "/api/auth/mobile/login",
        {
          email,
          password,
          otpCode,
          isBackupCode,
        },
        { requiresAuth: false }
      );

      if (res?.requireOtp) {
        return {
          success: false,
          requireOtp: true,
          twoFactorMethod: res.twoFactorMethod,
          message: res.message,
        };
      }

      if (res?.success && res.token && res.user) {
        await saveAuthToken(res.token);
        await saveAuthUser(res.user);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }

      return {
        success: false,
        message: res?.message || "Invalid credentials.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Network error. Please try again.",
      };
    }
  }

  async function logout() {
    try {
      await removeAuthToken();
      await removeAuthUser();
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  async function refreshProfile() {
    try {
      const res = await api.get("/api/auth/mobile/session");
      if (res?.success && res.user) {
        setUser(res.user);
        await saveAuthUser(res.user);
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  }

  async function toggleBiometrics(enable: boolean): Promise<boolean> {
    if (enable) {
      const success = await promptBiometricAuth("Confirm your biometrics to enable instant unlock");
      if (success) {
        await setBiometricsEnabled(true);
        setBiometricEnabledState(true);
        return true;
      }
      return false;
    } else {
      await setBiometricsEnabled(false);
      setBiometricEnabledState(false);
      return true;
    }
  }

  async function promptBiometricUnlock(): Promise<boolean> {
    if (!biometricEnabled) return false;
    return await promptBiometricAuth("Unlock Lorabiz with Face ID or Fingerprint");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        biometricAvailable,
        biometricEnabled,
        login,
        logout,
        refreshProfile,
        toggleBiometrics,
        promptBiometricUnlock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
