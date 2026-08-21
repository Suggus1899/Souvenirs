import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "souvenirs_session_token";

// expo-secure-store has no web implementation; localStorage is fine there since
// the web target only exists for local dev preview, not a real deployment target.
export const tokenStorage =
  Platform.OS === "web"
    ? {
        get: async () => localStorage.getItem(TOKEN_KEY),
        set: async (token: string) => localStorage.setItem(TOKEN_KEY, token),
        clear: async () => localStorage.removeItem(TOKEN_KEY),
      }
    : {
        get: () => SecureStore.getItemAsync(TOKEN_KEY),
        set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
        clear: () => SecureStore.deleteItemAsync(TOKEN_KEY),
      };
