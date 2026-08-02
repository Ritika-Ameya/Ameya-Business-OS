import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { CreateDealWizard } from "@/features/deals/components/CreateDealWizard";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { useAppConfig } from "@/features/settings/hooks/use-app-config";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import { recordTypeLabels } from "@/features/customers/utils/stage-utils";
import type { DealFormData } from "@/features/deals/types/deal";

export function CreateDealPage() {
  const { customerId: routeCustomerId } = useParams<{ customerId?: string }>();
  const navigate = useNavigate();
  const { customers, getCustomer, loading: customersLoading } = useCustomers();
  const { addDeal } = useDeals();
  const { stages } = useAppConfig();
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(routeCustomerId ?? "");

  const customerId = routeCustomerId || selectedCustomerId;
  const customer = customerId ? getCustomer(customerId) : undefined;
  const isStandalone = !routeCustomerId;

  const selectableCustomers = useMemo(
    () =>
      [...customers].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [customers]
  );

  if (customersLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (routeCustomerId && !customer) {
    return <Navigate to="/customers" replace />;
  }

  const handleSave = async (data: DealFormData) => {
    if (!customer) {
      setError("Select an opportunity or customer first");
      throw new Error("Select an opportunity or customer first");
    }

    setError(null);
    try {
      const deal = await addDeal(
        {
          ...data,
          customerId: customer.id,
          customerName: customer.name,
          customerRecordType: customer.recordType,
        },
        stages
      );
      navigate(`/deals/${deal.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const backHref = customer && !isStandalone ? `/customers/${customer.id}` : "/deals";
  const backLabel =
    customer && !isStandalone ? `Back to ${customer.name}` : "Back to Deals";

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" className="-ml-2 rounded-xl" asChild>
        <Link to={backHref}>
          <ArrowLeft />
          {backLabel}
        </Link>
      </Button>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {isStandalone && (
        <div className="space-y-2 rounded-2xl border border-border/70 bg-card/40 p-4 sm:p-5">
          <Label htmlFor="deal-customer">
            Opportunity / Customer <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedCustomerId}
            onValueChange={(value) => {
              setSelectedCustomerId(value);
              setError(null);
            }}
          >
            <SelectTrigger id="deal-customer" className="rounded-xl">
              <SelectValue placeholder="Select an existing opportunity or customer" />
            </SelectTrigger>
            <SelectContent>
              {selectableCustomers.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                  {item.company && item.company !== item.name
                    ? ` · ${item.company}`
                    : ""}{" "}
                  ({recordTypeLabels[item.recordType]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectableCustomers.length === 0 ? (
            <p className="text-xs text-destructive">
              No opportunities or customers found. Create one from Customers first.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Only existing opportunities/customers can be selected. Create a new one from
              Customers if needed.
            </p>
          )}
        </div>
      )}

      {customer ? (
        <CreateDealWizard
          customerId={customer.id}
          customerName={customer.name}
          cancelHref={backHref}
          onSave={handleSave}
        />
      ) : (
        isStandalone && (
          <p className="rounded-2xl border border-dashed border-border/70 px-5 py-10 text-center text-sm text-muted-foreground">
            Select an opportunity or customer above to continue creating the deal.
          </p>
        )
      )}
    </div>
  );
}
