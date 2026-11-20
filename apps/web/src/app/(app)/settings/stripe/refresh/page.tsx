import Link from "next/link";
import { StripeOnboardingButton } from "@/components/settings/stripe-onboarding-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Stripe sends the user here when the onboarding link expired or was already used. */
export default function StripeRefreshPage() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>El link de Stripe expiró</CardTitle>
        <CardDescription>
          Los links de conexión con Stripe duran pocos minutos. Genera uno nuevo para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <StripeOnboardingButton alreadyConnected />
        <Button variant="ghost" asChild>
          <Link href="/settings">Volver a configuración</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
