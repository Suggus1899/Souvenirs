import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAmount, formatMoney, toCents } from "@/lib/money";

interface Item {
  description: string;
  quantity: number;
  unitPrice: string;
}

/** Line items with per-row subtotal; used on the detail, print and public payment pages. */
export function InvoiceItemsTable({
  items,
  currency,
  totalAmount,
}: {
  items: Item[];
  currency: string;
  totalAmount: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Concepto</TableHead>
          <TableHead className="text-right">Cant.</TableHead>
          <TableHead className="text-right">Precio unit.</TableHead>
          <TableHead className="text-right">Subtotal</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-muted-foreground">
              Servicio
            </TableCell>
          </TableRow>
        ) : (
          items.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="whitespace-normal">{item.description}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">{formatAmount(item.unitPrice, currency)}</TableCell>
              <TableCell className="text-right">
                {formatMoney(item.quantity * toCents(item.unitPrice), currency)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} className="text-right font-medium">
            Total
          </TableCell>
          <TableCell className="text-right font-medium">{formatAmount(totalAmount, currency)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
