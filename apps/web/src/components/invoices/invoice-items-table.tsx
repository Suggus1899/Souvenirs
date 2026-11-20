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
          <TableHead className="hidden text-right sm:table-cell">Cant.</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Precio unit.</TableHead>
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
              <TableCell className="whitespace-normal">
                {item.description}
                <span className="block text-xs text-muted-foreground sm:hidden">
                  {item.quantity} × {formatAmount(item.unitPrice, currency)}
                </span>
              </TableCell>
              <TableCell className="hidden text-right sm:table-cell">{item.quantity}</TableCell>
              <TableCell className="hidden text-right sm:table-cell">{formatAmount(item.unitPrice, currency)}</TableCell>
              <TableCell className="text-right">
                {formatMoney(item.quantity * toCents(item.unitPrice), currency)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="text-right font-medium sm:hidden">Total</TableCell>
          <TableCell colSpan={3} className="hidden text-right font-medium sm:table-cell">
            Total
          </TableCell>
          <TableCell className="text-right font-medium">{formatAmount(totalAmount, currency)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
