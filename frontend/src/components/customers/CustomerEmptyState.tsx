import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface CustomerEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function CustomerEmptyState(props: CustomerEmptyStateProps) {
  return <EmptyState {...props} />;
}
