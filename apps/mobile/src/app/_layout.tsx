import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import "@/lib/notifications-config";
import { darkTheme, lightTheme } from "@/lib/theme";
import { useRegisterPushToken } from "@/lib/use-register-push-token";

/** Tapping a reminder push opens the invoice it is about (or the bookings tab). */
function useNotificationNavigation(enabled: boolean) {
  useEffect(() => {
    // Notification responses are native-only; the web preview has no such API.
    if (!enabled || Platform.OS === "web") return;
    const open = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as { type?: string; id?: string };
      if (data?.type === "INVOICE" && data.id) router.push(`/invoice/${data.id}`);
      else if (data?.type === "BOOKING") router.push("/");
    };
    // The app may have been launched by the tap itself.
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [enabled]);
}

function RootNavigator() {
  const { token, isLoading } = useAuth();
  useRegisterPushToken(Boolean(token));
  useNotificationNavigation(Boolean(token));

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(token)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="invoice/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <PaperProvider theme={colorScheme === "dark" ? darkTheme : lightTheme}>
        <RootNavigator />
      </PaperProvider>
    </AuthProvider>
  );
}
