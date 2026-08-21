import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import { apiFetch } from "./api";

/** Best-effort: registers this device's Expo push token against the logged-in user. */
export function useRegisterPushToken(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !Device.isDevice) return;

    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
      const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );

      await apiFetch("/users/me/push-tokens", {
        method: "POST",
        body: JSON.stringify({
          token: expoPushToken,
          platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
        }),
      });
    })().catch(() => {
      // Push registration is best-effort; a failure here shouldn't block app usage.
    });
  }, [enabled]);
}
