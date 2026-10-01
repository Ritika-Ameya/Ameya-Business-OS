import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

export interface StatDetailRow {
  id: string;
  title: string;
  subtitle?: string;
  detail?: string;
  value?: string;
  to?: string;
}

export function StatDetailDialog({
  open,
  title,
  description,
  rows,
  empty,
  nameLabel,
  valueLabel,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description?: string;
  rows: StatDetailRow[];
  empty: string;
  /** Left column heading, such as Customer. */
  nameLabel?: string;
  /** Right column heading, such as Outstanding. */
  valueLabel?: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
            {nameLabel || valueLabel ? (
              <li className="flex items-center justify-between gap-3 bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{nameLabel}</span>
                {valueLabel ? <span>{valueLabel}</span> : null}
              </li>
            ) : null}
            {rows.map((row) => {
              const body = (
                <>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.title}</p>
                    {row.subtitle ? (
                      <p className="truncate text-xs text-muted-foreground">{row.subtitle}</p>
                    ) : null}
                    {row.detail ? (
                      <p className="truncate text-xs text-muted-foreground">{row.detail}</p>
                    ) : null}
                  </div>
                  {row.value ? (
                    <span className="max-w-[16rem] shrink-0 text-right text-sm font-semibold tabular-nums leading-snug">
                      {row.value}
                    </span>
                  ) : null}
                </>
              );
              return (
                <li key={row.id}>
                  {row.to ? (
                    <Link
                      to={row.to}
                      className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                      onClick={() => onOpenChange(false)}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
