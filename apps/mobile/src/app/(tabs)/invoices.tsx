import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Card, Chip, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "@/lib/api";
import { INVOICE_STATUS_LABEL, invoiceNumber } from "@/lib/labels";
import type { Client, Invoice } from "@souvenirs/shared";

const PENDING_STATUSES: Invoice["status"][] = ["SENT", "PARTIAL", "OVERDUE"];

export default function InvoicesScreen() {
  const theme = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientsById, setClientsById] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [invoicesData, clientsData] = await Promise.all([
        apiFetch<Invoice[]>("/invoices?take=200"),
        apiFetch<Client[]>("/clients?take=200"),
      ]);
      setInvoices(invoicesData.filter((i) => PENDING_STATUSES.includes(i.status)));
      setClientsById(new Map(clientsData.map((c) => [c.id, c.name])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar las facturas");
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
        Facturas pendientes
      </Text>
      {error && (
        <Text variant="bodySmall" style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No tienes facturas pendientes de cobro.</Text>}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => router.push(`/invoice/${item.id}`)}
            accessibilityHint="Abre el detalle para registrar un pago"
          >
            <Card.Content>
              <Text variant="titleMedium">
                {invoiceNumber(item.number)} · {clientsById.get(item.clientId) ?? "—"}
              </Text>
              <View style={styles.row}>
                <Text variant="bodyMedium">
                  {item.totalAmount} {item.currency}
                </Text>
                <Chip compact>{INVOICE_STATUS_LABEL[item.status]}</Chip>
              </View>
              {item.dueDate && (
                <Text variant="bodySmall" style={styles.due}>
                  Vence: {new Date(item.dueDate).toLocaleDateString("es-VE", { timeZone: "UTC" })}
                </Text>
              )}
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
  due: { marginTop: 4, opacity: 0.7 },
  empty: { textAlign: "center", marginTop: 40, opacity: 0.6 },
});
