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
  getSavedProfile,
  saveSavedProfile,
  removeSavedProfile,
  SavedProfile,
} from "../lib/storage";
import { api, BASE_URL } from "../lib/api";
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
  savedProfile: SavedProfile | null;
  isLoading: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  login: (email: string, password: string, otpCode?: string, isBackupCode?: boolean) => Promise<LoginResult>;
  logout: () => Promise<void>;
  clearSavedProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<boolean>;
  promptBiometricUnlock: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const name = parts[0];
  const maskedName =
    name.length <= 3
      ? name[0] + "***"
      : name.slice(0, 3) + "***" + (name.length > 5 ? name.slice(-1) : "");
  return `${maskedName}@${parts[1]}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
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

      // 2. Load stored saved profile for returning user UX
      const profile = await getSavedProfile();
      if (profile) {
        setSavedProfile(profile);
      }

      // 3. Load stored token and user
      const storedToken = await getAuthToken();
      const storedUser = await getAuthUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        // Quiet background session validation
        fetch(`${BASE_URL}/api/auth/session`, {
          headers: {
            Cookie: `next-auth.session-token=${storedToken}; __Secure-next-auth.session-token=${storedToken}`,
          },
        })
          .then((r) => r.json())
          .then((res) => {
            if (res?.user) {
              const updatedUser = {
                ...storedUser,
                ...res.user,
              };
              setUser(updatedUser);
              saveAuthUser(updatedUser);
            }
          })
          .catch(() => {
            // Session refresh failure
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
    const trimmedEmail = email.trim().toLowerCase();

    // Strategy 1: Universal NextAuth Credentials Flow (Live Production Server)
    try {
      const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
      const csrfData = await csrfRes.json();
      const csrfCookie = csrfRes.headers.get("set-cookie") || "";

      const postRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          ...(csrfCookie ? { Cookie: csrfCookie } : {}),
        },
        body: new URLSearchParams({
          csrfToken: csrfData.csrfToken || "",
          email: trimmedEmail,
          password,
          ...(otpCode ? { otpCode: otpCode.trim() } : {}),
          json: "true",
        }),
      });

      const setCookies = postRes.headers.get("set-cookie") || "";
      const text = await postRes.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { url: text };
      }

      // Handle Authentication Error Redirect
      if (data?.url && data.url.includes("error=")) {
        try {
          const urlObj = new URL(data.url);
          const rawErr = urlObj.searchParams.get("error") || "Invalid email or password.";
          return { success: false, message: decodeURIComponent(rawErr) };
        } catch {
          return { success: false, message: "Invalid email or password." };
        }
      }

      // Handle 2FA Challenge Redirect
      if (data?.url && (data.url.includes("verify-2fa") || data.url.includes("otp"))) {
        return {
          success: false,
          requireOtp: true,
          message: "Please enter the 6-digit verification code to complete sign in.",
        };
      }

      // Extract Session Token from Set-Cookie header
      const tokenMatch = setCookies.match(/(?:__Secure-)?next-auth\.session-token=([^;]+)/);
      const sessionToken = tokenMatch ? tokenMatch[1] : "";

      if (sessionToken || postRes.ok) {
        const activeToken = sessionToken || `session_${Date.now()}`;

        // Retrieve full authenticated user profile
        let userProfile: UserProfile = {
          id: `user_${Date.now()}`,
          email: trimmedEmail,
          name: trimmedEmail.split("@")[0],
          firstName: trimmedEmail.split("@")[0],
          role: "USER",
        };

        try {
          const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
            headers: {
              Cookie: `next-auth.session-token=${activeToken}; __Secure-next-auth.session-token=${activeToken}`,
            },
          });
          const sessionData = await sessionRes.json();
          if (sessionData?.user) {
            userProfile = {
              id: sessionData.user.id || userProfile.id,
              email: sessionData.user.email || trimmedEmail,
              name: sessionData.user.name || userProfile.name,
              firstName: sessionData.user.name?.split(" ")[0] || userProfile.firstName,
              role: sessionData.user.role || "USER",
              image: sessionData.user.image || null,
            };
          }
        } catch {
          // Keep base profile
        }

        await saveAuthToken(activeToken);
        await saveAuthUser(userProfile);
        setToken(activeToken);
        setUser(userProfile);

        // Save persistent profile for returning user quick-unlock
        const profileToSave: SavedProfile = {
          id: userProfile.id,
          name: userProfile.name,
          firstName: userProfile.firstName || userProfile.name.split(" ")[0] || "User",
          email: userProfile.email,
          maskedEmail: maskEmail(userProfile.email),
          image: userProfile.image,
        };
        await saveSavedProfile(profileToSave);
        setSavedProfile(profileToSave);

        return { success: true };
      }
    } catch (nextAuthErr) {
      console.warn("NextAuth callback failed, trying mobile endpoint fallback:", nextAuthErr);
    }

    // Strategy 2: Mobile Dedicated API Route Fallback (When deployed)
    try {
      const res = await api.post(
        "/api/auth/mobile/login",
        {
          email: trimmedEmail,
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

        const profileToSave: SavedProfile = {
          id: res.user.id,
          name: res.user.name,
          firstName: res.user.firstName || res.user.name.split(" ")[0] || "User",
          lastName: res.user.lastName,
          email: res.user.email,
          maskedEmail: maskEmail(res.user.email),
          image: res.user.image,
        };
        await saveSavedProfile(profileToSave);
        setSavedProfile(profileToSave);

        return { success: true };
      }

      return {
        success: false,
        message: res?.message || "Invalid credentials.",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "Invalid email or password. Please verify your credentials.",
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

  async function clearSavedProfile() {
    try {
      await removeSavedProfile();
      setSavedProfile(null);
    } catch (err) {
      console.error("Clear saved profile error:", err);
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
        savedProfile,
        isLoading,
        biometricAvailable,
        biometricEnabled,
        login,
        logout,
        clearSavedProfile,
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
