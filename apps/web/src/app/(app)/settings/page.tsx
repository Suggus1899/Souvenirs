import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { StripeOnboardingButton } from "@/components/settings/stripe-onboarding-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-server";
import type { Tenant } from "@souvenirs/shared";

export default async function SettingsPage() {
  const tenant = await apiFetch<Tenant>("/tenants/me");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl">Configuración</h1>
      <Card>
        <CardHeader>
          <CardTitle>Cobros con Stripe</CardTitle>
          <CardDescription>
            Conectá tu cuenta de Stripe para poder generar links de pago y cobrar online a tus
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
            <StripeOnboardingButton alreadyConnected={Boolean(tenant.stripeAccountId)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
