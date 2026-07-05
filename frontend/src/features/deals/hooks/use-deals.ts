import { useContext } from "react";
import { DealsContext } from "@/features/deals/hooks/DealsContext";

export function useDeals() {
  const context = useContext(DealsContext);
  if (!context) {
    throw new Error("useDeals must be used within DealsProvider");
  }
  return context;
}
