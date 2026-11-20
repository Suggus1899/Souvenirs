import { redirect } from "next/navigation";

/** Stripe sends the user here after the Connect onboarding form; the webhook updates the real status. */
export default function StripeReturnPage() {
  redirect("/settings?stripe=returned");
}
