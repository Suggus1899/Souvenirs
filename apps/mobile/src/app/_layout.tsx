import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import "@/lib/notifications-config";
import { darkTheme, lightTheme } from "@/lib/theme";
import { useRegisterPushToken } from "@/lib/use-register-push-token";

function RootNavigator() {
  const { token, isLoading } = useAuth();
  useRegisterPushToken(Boolean(token));

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(token)}>
        <Stack.Screen name="(tabs)" />
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
