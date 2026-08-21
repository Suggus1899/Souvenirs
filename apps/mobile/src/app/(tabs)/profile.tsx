import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";

export default function ProfileScreen() {
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.flex}>
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Perfil
        </Text>
        <Button mode="outlined" onPress={logout}>
          Cerrar sesión
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: 16, gap: 16 },
  title: { marginBottom: 8 },
});
