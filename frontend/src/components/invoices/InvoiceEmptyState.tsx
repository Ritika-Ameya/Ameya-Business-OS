import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";

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
