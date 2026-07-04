import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { seedCustomers } from "@/data/seed-customers";
import type { Customer, CustomerFormData } from "@/types/customer";

const STORAGE_KEY = "ameya-customers";

interface CustomersContextValue {
  customers: Customer[];
  addCustomer: (data: CustomerFormData) => Customer;
  updateCustomer: (id: string, data: CustomerFormData) => void;
  getCustomer: (id: string) => Customer | undefined;
}

const CustomersContext = createContext<CustomersContextValue | null>(null);

export { CustomersContext };

function normalizeCustomer(customer: Customer): Customer {
  return {
    ...customer,
    billingAddress: customer.billingAddress ?? customer.address,
    serviceAddress: customer.serviceAddress ?? customer.billingAddress ?? customer.address,
  };
}

function loadCustomers(): Customer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return (JSON.parse(stored) as Customer[]).map(normalizeCustomer);
    }
  } catch {
    // fall through to seed data
  }
  return seedCustomers.map(normalizeCustomer);
}

function persistCustomers(customers: Customer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

function formToCustomerFields(data: CustomerFormData) {
  return {
    name: data.name.trim(),
    company: data.company.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    gst: data.gst.trim().toUpperCase() || undefined,
    billingAddress: data.billingAddress.trim() || undefined,
    serviceAddress: data.serviceAddress.trim() || undefined,
    address: data.billingAddress.trim() || undefined,
    notes: data.notes.trim() || undefined,
  };
}

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(loadCustomers);

  const addCustomer = useCallback((data: CustomerFormData): Customer => {
    const customer: Customer = {
      id: `cust-${crypto.randomUUID().slice(0, 8)}`,
      ...formToCustomerFields(data),
      status: "active",
      outstanding: 0,
      activeDeals: 0,
      businessValue: 0,
      createdAt: new Date().toISOString().split("T")[0],
      businessSince: new Date().toISOString().split("T")[0],
    };

    setCustomers((prev) => {
      const next = [customer, ...prev];
      persistCustomers(next);
      return next;
    });

    return customer;
  }, []);

  const updateCustomer = useCallback((id: string, data: CustomerFormData) => {
    setCustomers((prev) => {
      const next = prev.map((customer) =>
        customer.id === id
          ? {
              ...customer,
              ...formToCustomerFields(data),
            }
          : customer
      );
      persistCustomers(next);
      return next;
    });
  }, []);

  const getCustomer = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers]
  );

  const value = useMemo(
    () => ({ customers, addCustomer, updateCustomer, getCustomer }),
    [customers, addCustomer, updateCustomer, getCustomer]
  );

  return (
    <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>
  );
}
