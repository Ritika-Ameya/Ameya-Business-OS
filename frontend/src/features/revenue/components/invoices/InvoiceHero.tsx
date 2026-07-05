import { Calendar, FileText, Handshake, User } from "lucide-react";
import { Link } from "react-router-dom";
import { InvoiceStatusBadge } from "@/features/revenue/components/invoices/InvoiceStatusBadge";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "@/features/revenue/utils/invoice-utils";
import { cn } from "@/shared/utils";
import type { Invoice } from "@/features/revenue/types/invoice";

interface InvoiceHeroProps {
  invoice: Invoice;
}

function HeroMetric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold sm:text-base",
          highlight && "text-amber-700 dark:text-amber-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function InvoiceHero({ invoice }: InvoiceHeroProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/20">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <InvoiceStatusBadge status={invoice.status} />
              {invoice.outstanding > 0 && (
                <span className="rounded-full border border-amber-500/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {formatInvoiceCurrency(invoice.outstanding)} due
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {invoice.invoiceNo}
              </h1>
              <Link
                to={`/customers/${invoice.customerId}`}
                className="mt-1 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <User className="size-4" />
                {invoice.customerName}
              </Link>
              <Link
                to={`/deals/${invoice.dealId}`}
                className="mt-1 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Handshake className="size-4" />
                {invoice.dealTitle}
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <FileText className="size-4" />
                Issued {formatInvoiceDate(invoice.invoiceDate)}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="size-4" />
                Due {formatInvoiceDate(invoice.dueDate)}
              </span>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-lg lg:grid-cols-2">
            <HeroMetric
              label="Invoice Amount"
              value={formatInvoiceCurrency(invoice.amount)}
            />
            <HeroMetric
              label="Received Amount"
              value={formatInvoiceCurrency(invoice.received)}
            />
            <HeroMetric
              label="Outstanding"
              value={formatInvoiceCurrency(invoice.outstanding)}
              highlight={invoice.outstanding > 0}
            />
            <HeroMetric
              label="Due Date"
              value={formatInvoiceDate(invoice.dueDate)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
