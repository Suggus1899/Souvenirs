import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { apiFetch } from "@/lib/api";
import {
  fromCents,
  INVOICE_STATUS_LABEL,
  invoiceNumber,
  MANUAL_METHODS,
  PAYMENT_METHOD_LABEL,
  toCents,
} from "@/lib/labels";
import type { Client, Invoice, PaymentMethod } from "@souvenirs/shared";

export default function InvoiceDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const inv = await apiFetch<Invoice>(`/invoices/${id}`);
      setInvoice(inv);
      setClient(await apiFetch<Client>(`/clients/${inv.clientId}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar la factura");
    }
  }, [id]);

  useEffect(() => {
    // Initial fetch on mount (same pattern as the tab screens); not syncing external state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: true, title: "Factura" }} />
        {error ? <Text style={{ color: theme.colors.error }}>{error}</Text> : <ActivityIndicator />}
      </View>
    );
  }

  const payments = invoice.payments ?? [];
  const paidCents = payments.reduce((sum, p) => sum + toCents(p.amount), 0);
  const balanceCents = toCents(invoice.totalAmount) - paidCents;
  const canPay = invoice.status !== "PAID" && invoice.status !== "CANCELLED" && balanceCents > 0;

  async function registerPayment() {
    setFormError(null);
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setFormError("Escribe un monto válido");
      return;
    }
    if (toCents(value) > balanceCents) {
      setFormError(`El monto supera el saldo (${fromCents(balanceCents)} ${invoice!.currency})`);
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/payments", {
        method: "POST",
        body: JSON.stringify({ invoiceId: invoice!.id, amount: value, method }),
      });
      setAmount("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No pudimos registrar el pago");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ headerShown: true, title: `Factura ${invoiceNumber(invoice.number)}` }} />
      <Card>
        <Card.Content style={styles.gap}>
          <View style={styles.row}>
            <Text variant="titleLarge">{client?.name ?? "—"}</Text>
            <Chip compact>{INVOICE_STATUS_LABEL[invoice.status]}</Chip>
          </View>
          <Text variant="headlineMedium">
            {invoice.totalAmount} {invoice.currency}
          </Text>
          <Text variant="bodyMedium">
            Pagado {fromCents(paidCents)} · Saldo {fromCents(Math.max(balanceCents, 0))}
          </Text>
          {invoice.dueDate && (
            <Text variant="bodySmall" style={styles.muted}>
              Vence: {new Date(invoice.dueDate).toLocaleDateString("es-VE", { timeZone: "UTC" })}
            </Text>
          )}
          {(invoice.items ?? []).map((item) => (
            <Text key={item.id} variant="bodySmall">
              {item.quantity} × {item.description} — {item.unitPrice}
            </Text>
          ))}
        </Card.Content>
      </Card>

      {canPay && (
        <Card>
          <Card.Title title="Registrar pago" />
          <Card.Content style={styles.gap}>
            <TextInput
              label={`Monto (${invoice.currency})`}
              mode="outlined"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder={fromCents(balanceCents)}
            />
            <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Método de pago">
              {MANUAL_METHODS.map((m) => (
                <Chip
                  key={m}
                  selected={method === m}
                  showSelectedCheck={false}
                  mode={method === m ? "flat" : "outlined"}
                  onPress={() => setMethod(m)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: method === m }}
                >
                  {PAYMENT_METHOD_LABEL[m]}
                </Chip>
              ))}
            </View>
            <HelperText type="error" visible={Boolean(formError)}>
              {formError}
            </HelperText>
            <Button mode="contained" onPress={registerPayment} loading={saving} disabled={saving}>
              Registrar
            </Button>
          </Card.Content>
        </Card>
      )}

      <Card>
        <Card.Title title="Pagos" />
        <Card.Content>
          {payments.length === 0 ? (
            <Text style={styles.muted}>Todavía no se registraron pagos.</Text>
          ) : (
            payments.map((p, index) => (
              <View key={p.id}>
                {index > 0 && <Divider style={styles.divider} />}
                <View style={styles.row}>
                  <Text>{PAYMENT_METHOD_LABEL[p.method]}</Text>
                  <Text>
                    {p.amount} {invoice.currency}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.muted}>
                  {new Date(p.paidAt).toLocaleDateString("es-VE")}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 16 },
  gap: { gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  muted: { opacity: 0.7 },
  divider: { marginVertical: 8 },
});
