import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api-server";
import { formatDate } from "@/lib/labels";
import type { TeamMember, UserProfile } from "@souvenirs/shared";

export default async function TeamPage() {
  const [team, me] = await Promise.all([
    apiFetch<TeamMember[]>("/users"),
    apiFetch<UserProfile>("/users/me"),
  ]);
  const isOwner = me.role === "OWNER";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl">Configuración</h1>
      <SettingsNav current="/settings/team" />
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Equipo</CardTitle>
            <CardDescription>Personas con acceso al panel de tu estudio.</CardDescription>
          </div>
          {isOwner && <InviteMemberDialog />}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden xl:table-cell">Desde</TableHead>
                {isOwner && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium whitespace-normal">
                    {member.name}
                    {member.id === me.id && <span className="text-muted-foreground"> (tú)</span>}
                    <span className="block text-xs font-normal break-all text-muted-foreground lg:hidden">
                      {member.email}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "OWNER" ? "default" : "outline"}>
                      {member.role === "OWNER" ? "Dueño" : "Asistente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(member.createdAt)}</TableCell>
                  {isOwner && (
                    <TableCell className="text-right">
                      {member.role !== "OWNER" && (
                        <ConfirmDeleteButton
                          path={`/users/${member.id}`}
                          title={`¿Quitar a ${member.name} del equipo?`}
                          description="Perderá el acceso al panel de inmediato, incluso si tiene una sesión abierta."
                          successMessage="Miembro eliminado"
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
