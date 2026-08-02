import { MessageCircle, MapPin, Handshake, History, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { normalizePhoneToE164 } from "@/shared/utils/phone";
import {
  getCustomerBillingAddress,
  getCustomerServiceAddress,
} from "@/features/settings/utils/app-config-utils";
import type { Customer } from "@/features/customers/types/customer";

interface CustomerQuickActionsProps {
  customer: Customer;
  onOpenTimeline: () => void;
}

function toWhatsAppHref(phone: string): string | null {
  const normalized = normalizePhoneToE164(phone, { required: true });
  const raw =
    normalized === "__INVALID__"
      ? phone.replace(/[^\d+]/g, "")
      : normalized;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}`;
}

function toMapsHref(customer: Customer): string | null {
  const address =
    getCustomerServiceAddress(customer) ||
    getCustomerBillingAddress(customer) ||
    "";
  const trimmed = address.trim();
  if (!trimmed) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

export function CustomerQuickActions({
  customer,
  onOpenTimeline,
}: CustomerQuickActionsProps) {
  const phoneHref = normalizePhoneToE164(customer.phone, { required: true });
  const whatsAppHref = toWhatsAppHref(customer.phone);
  const mapsHref = toMapsHref(customer);

  return (
    <div className="flex flex-wrap gap-2">
      <Button className="rounded-xl" asChild>
        <Link to={`/customers/${customer.id}/deals/new`}>
          <Handshake />
          Create Deal
        </Link>
      </Button>
      <Button variant="outline" className="rounded-xl" asChild>
        <a
          href={`tel:${phoneHref === "__INVALID__" ? customer.phone.replace(/\s/g, "") : phoneHref}`}
        >
          <Phone />
          Call
        </a>
      </Button>
      {whatsAppHref && (
        <Button variant="outline" className="rounded-xl" asChild>
          <a href={whatsAppHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle />
            WhatsApp
          </a>
        </Button>
      )}
      {customer.email && (
        <Button variant="outline" className="rounded-xl" asChild>
          <a href={`mailto:${customer.email}`}>
            <Mail />
            Email
          </a>
        </Button>
      )}
      {mapsHref && (
        <Button variant="outline" className="rounded-xl" asChild>
          <a href={mapsHref} target="_blank" rel="noopener noreferrer">
            <MapPin />
            Maps
          </a>
        </Button>
      )}
      <Button variant="outline" className="rounded-xl" onClick={onOpenTimeline}>
        <History />
        Open Timeline
      </Button>
    </div>
  );
}
