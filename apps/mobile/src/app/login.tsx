import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const { login } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <Text variant="headlineMedium" style={styles.title}>
            Souvenirs
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Ingresá a tu cuenta para ver tus reservas y facturas.
          </Text>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          {error && (
            <Text variant="bodySmall" style={{ color: theme.colors.error }}>
              {error}
            </Text>
          )}
          <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.button}>
            Ingresar
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 12 },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: 12, opacity: 0.7 },
  input: { marginBottom: 4 },
  button: { marginTop: 8 },
});
