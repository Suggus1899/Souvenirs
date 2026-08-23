import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Card, Chip, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";
import type { Booking, Client } from "@souvenirs/shared";

const STATUS_LABEL: Record<Booking["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export default function BookingsScreen() {
  const theme = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clientsById, setClientsById] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [bookingsData, clientsData] = await Promise.all([
        apiFetch<Booking[]>("/bookings"),
        apiFetch<Client[]>("/clients"),
      ]);
      const now = Date.now();
      const upcoming = bookingsData
        .filter((b) => new Date(b.scheduledAt).getTime() >= now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      setBookings(upcoming);
      setClientsById(new Map(clientsData.map((c) => [c.id, c.name])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar las reservas");
    }
  }, []);

  useEffect(() => {
    // Standard initial-fetch loading flag; not an external-system sync, just UI state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <Text variant="headlineSmall" style={styles.header}>
        Reservas próximas
      </Text>
      {error && (
        <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No tenés reservas próximas.</Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{item.title}</Text>
              <Text variant="bodyMedium">{clientsById.get(item.clientId) ?? "—"}</Text>
              <View style={styles.row}>
                <Text variant="bodySmall">
                  {new Date(item.scheduledAt).toLocaleString("es-AR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
                <Chip compact>{STATUS_LABEL[item.status]}</Chip>
              </View>
            </Card.Content>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  error: { paddingHorizontal: 16, paddingBottom: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  empty: { textAlign: "center", marginTop: 40, opacity: 0.6 },
});
