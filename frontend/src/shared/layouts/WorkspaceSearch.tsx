import { Building2, FileText, Handshake, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useRevenue } from "@/features/revenue/hooks/use-revenue";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/utils";

type SearchResult = {
  id: string;
  type: "customer" | "deal" | "invoice";
  title: string;
  subtitle: string;
  href: string;
};

const MAX_RESULTS = 8;

function matchesQuery(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query);
}

export function WorkspaceSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { deals } = useDeals();
  const { invoices } = useRevenue();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const results = useMemo((): SearchResult[] => {
    if (deferredQuery.length < 1) return [];

    const customerResults: SearchResult[] = customers
      .filter((customer) =>
        [
          customer.name,
          customer.company,
          customer.email,
          customer.phone,
          customer.gst ?? "",
          customer.vatId ?? "",
          customer.licenseNo ?? "",
        ].some((field) => matchesQuery(field, deferredQuery))
      )
      .slice(0, MAX_RESULTS)
      .map((customer) => ({
        id: `customer-${customer.id}`,
        type: "customer",
        title: customer.name,
        subtitle: `${customer.recordType === "opportunity" ? "Opportunity" : "Customer"} · ${customer.company || customer.email || "—"}`,
        href: `/customers/${customer.id}`,
      }));

    const dealResults: SearchResult[] = deals
      .filter((deal) =>
        [deal.title, deal.customerName, deal.dealType ?? ""].some((field) =>
          matchesQuery(field, deferredQuery)
        )
      )
      .slice(0, MAX_RESULTS)
      .map((deal) => ({
        id: `deal-${deal.id}`,
        type: "deal",
        title: deal.title,
        subtitle: `Deal · ${deal.customerName}`,
        href: `/deals/${deal.id}`,
      }));

    const invoiceResults: SearchResult[] = invoices
      .filter((invoice) =>
        [invoice.invoiceNo, invoice.customerName, invoice.dealTitle ?? ""].some((field) =>
          matchesQuery(field, deferredQuery)
        )
      )
      .slice(0, MAX_RESULTS)
      .map((invoice) => ({
        id: `invoice-${invoice.id}`,
        type: "invoice",
        title: invoice.invoiceNo,
        subtitle: `Invoice · ${invoice.customerName}`,
        href: `/invoices/${invoice.id}`,
      }));

    return [...customerResults, ...dealResults, ...invoiceResults].slice(0, MAX_RESULTS);
  }, [customers, deals, deferredQuery, invoices]);

  useEffect(() => {
    setActiveIndex(0);
  }, [deferredQuery]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const goTo = (href: string) => {
    setOpen(false);
    setQuery("");
    navigate(href);
  };

  const iconFor = (type: SearchResult["type"]) => {
    if (type === "deal") return Handshake;
    if (type === "invoice") return FileText;
    return Building2;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-primary/60"
        aria-hidden
      />
      <Input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
          }
          if (e.key === "Escape") {
            setOpen(false);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, Math.max(results.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
          } else if (e.key === "Enter" && results[activeIndex]) {
            e.preventDefault();
            goTo(results[activeIndex]!.href);
          }
        }}
        placeholder="Search workspace…"
        aria-label="Search workspace"
        aria-expanded={open}
        aria-controls="workspace-search-results"
        className={cn(
          "h-10 w-full rounded-2xl border-primary/10 bg-white/80 pl-10 pr-3 shadow-sm md:w-36",
          "lg:w-56 xl:w-64 dark:bg-white/5"
        )}
      />

      {open && query.trim().length > 0 && (
        <div
          id="workspace-search-results"
          role="listbox"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border/70 bg-popover shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matches for “{query.trim()}”
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((result, index) => {
                const Icon = iconFor(result.type);
                return (
                  <li key={result.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                        index === activeIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/60"
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(result.href)}
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{result.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
            Press Enter to open · Esc to close · Ctrl/⌘ K to focus
          </p>
        </div>
      )}
    </div>
  );
}
