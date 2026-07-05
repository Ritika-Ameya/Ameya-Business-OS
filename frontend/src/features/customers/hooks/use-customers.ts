import { useContext } from "react";
import { CustomersContext } from "@/features/customers/hooks/CustomersContext";

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (!context) {
    throw new Error("useCustomers must be used within CustomersProvider");
  }
  return context;
}
