import { useContext } from "react";
import { RevenueContext } from "@/features/revenue/hooks/RevenueContext";

export function useRevenue() {
  const context = useContext(RevenueContext);
  if (!context) {
    throw new Error("useRevenue must be used within RevenueProvider");
  }
  return context;
}
