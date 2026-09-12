import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "lorabiz_mobile_session_token";
const USER_KEY = "lorabiz_mobile_user";
const BIOMETRIC_KEY = "lorabiz_biometric_enabled";

// Web fallback if running on web preview
const memoryStorage: Record<string, string> = {};

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStorage[key] = value;
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key) || memoryStorage[key] || null;
    } catch {
      return memoryStorage[key] || null;
    }
  }
  return await SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {
      delete memoryStorage[key];
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveAuthToken(token: string): Promise<void> {
  await setItem(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return await getItem(TOKEN_KEY);
}

export async function removeAuthToken(): Promise<void> {
  await deleteItem(TOKEN_KEY);
}

export async function saveAuthUser(user: any): Promise<void> {
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function getAuthUser(): Promise<any | null> {
  const data = await getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function removeAuthUser(): Promise<void> {
  await deleteItem(USER_KEY);
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  await setItem(BIOMETRIC_KEY, enabled ? "true" : "false");
}

export async function isBiometricsEnabled(): Promise<boolean> {
  const val = await getItem(BIOMETRIC_KEY);
  return val === "true";
}

export async function clearAllAuth(): Promise<void> {
  await removeAuthToken();
  await removeAuthUser();
}
