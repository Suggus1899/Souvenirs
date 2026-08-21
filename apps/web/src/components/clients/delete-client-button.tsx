import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  return (
    <ConfirmDeleteButton
      path={`/clients/${clientId}`}
      title={`¿Eliminar a ${clientName}?`}
      description="Esta acción no se puede deshacer. Se eliminarán también sus reservas y facturas asociadas."
      successMessage="Cliente eliminado"
    />
  );
}
