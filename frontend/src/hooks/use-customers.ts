import { useContext } from "react";
import { CustomersContext } from "@/context/CustomersContext";

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (!context) {
    throw new Error("useCustomers must be used within CustomersProvider");
  }
  return context;
}
