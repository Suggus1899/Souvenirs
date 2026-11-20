import { ChangePasswordForm, ProfileNameForm } from "@/components/settings/profile-forms";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-server";
import type { UserProfile } from "@souvenirs/shared";

export default async function ProfilePage() {
  const me = await apiFetch<UserProfile>("/users/me");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl">Configuración</h1>
      <SettingsNav current="/settings/profile" />
      <Card>
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
          <CardDescription>
            {me.email} · {me.role === "OWNER" ? "Dueño del estudio" : "Asistente"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileNameForm name={me.name} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
