import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface InvoiceEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function InvoiceEmptyState(props: InvoiceEmptyStateProps) {
  return <EmptyState {...props} />;
}
