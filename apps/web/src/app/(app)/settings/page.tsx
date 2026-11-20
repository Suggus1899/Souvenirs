import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { BillingButton } from "@/components/settings/billing-button";
import { ReminderSettingsForm } from "@/components/settings/reminder-settings-form";
import { SettingsNav } from "@/components/settings/settings-nav";
import { StripeOnboardingButton } from "@/components/settings/stripe-onboarding-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-server";
import type { Tenant, UserProfile } from "@souvenirs/shared";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>;
}) {
  const [tenant, me, { stripe }] = await Promise.all([
    apiFetch<Tenant>("/tenants/me"),
    apiFetch<UserProfile>("/users/me"),
    searchParams,
  ]);
  const isOwner = me.role === "OWNER";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl">Configuración</h1>
      <SettingsNav current="/settings" />
      {stripe === "returned" && (
        <p role="status" className="rounded-md bg-muted px-4 py-2 text-sm">
          Volviste de Stripe. Si completaste los datos, la conexión se confirma en unos segundos.
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Recordatorios de pago</CardTitle>
          <CardDescription>
            Se programan al enviar una factura con fecha de vencimiento. Tú recibes un push; tu
            cliente, un email con el link para pagar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReminderSettingsForm
            offsets={tenant.reminderOffsetsDays}
            clientRemindersEnabled={tenant.clientRemindersEnabled}
            canEdit={isOwner}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Plan</CardTitle>
            <Badge variant={tenant.plan === "PRO" ? "default" : "outline"}>
              {tenant.plan === "PRO" ? "Pro" : "Gratis"}
            </Badge>
          </div>
          <CardDescription>
            {tenant.plan === "PRO"
              ? "Facturas ilimitadas y cobro online con Stripe."
              : "Hasta 5 facturas por mes. Actualiza a Pro para facturar sin límite."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOwner ? (
            <BillingButton plan={tenant.plan} />
          ) : (
            <p className="text-xs text-muted-foreground">Solo el dueño del estudio gestiona el plan.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cobros con Stripe</CardTitle>
          <CardDescription>
            Conecta tu cuenta de Stripe para poder generar links de pago y cobrar online a tus
            clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm">
            {tenant.stripeOnboarded ? (
              <>
                <CheckCircleIcon className="size-5 text-emerald-600" />
                <span>Tu cuenta de Stripe está conectada y lista para cobrar.</span>
              </>
            ) : (
              <>
                <ExclamationCircleIcon className="size-5 text-amber-600" />
                <span>
                  {tenant.stripeAccountId
                    ? "Empezaste el onboarding de Stripe pero todavía no está completo."
                    : "Todavía no conectaste una cuenta de Stripe."}
                </span>
              </>
            )}
          </div>
          <div>
            {isOwner && <StripeOnboardingButton alreadyConnected={Boolean(tenant.stripeAccountId)} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
