import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { customersApi } from "@/features/customers/api/customers.api";
import {
  mapCustomerFromDto,
  mapFormToCreateBody,
  mapFormToUpdateBody,
} from "@/features/customers/api/customer.mappers";
import { getErrorMessage } from "@/shared/api/getErrorMessage";
import type {
  Customer,
  CustomerFormData,
  RecordType,
} from "@/features/customers/types/customer";
import type { SettingsStage } from "@/features/settings/types/settings";

export interface StageChangePayload {
  stageId: string;
  nextActionDate?: string;
  notes?: string;
}

interface CustomersContextValue {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refreshCustomers: () => Promise<void>;
  addCustomer: (data: CustomerFormData, stages?: SettingsStage[]) => Promise<Customer>;
  updateCustomer: (id: string, data: CustomerFormData) => Promise<void>;
  changeCustomerStage: (
    id: string,
    payload: StageChangePayload,
    stages: SettingsStage[]
  ) => Promise<void>;
  updateRecordType: (
    id: string,
    recordType: RecordType,
    stages: SettingsStage[]
  ) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
}

const CustomersContext = createContext<CustomersContextValue | null>(null);

export { CustomersContext };

function upsertCustomer(list: Customer[], customer: Customer): Customer[] {
  const index = list.findIndex((item) => item.id === customer.id);
  if (index === -1) {
    return [customer, ...list];
  }
  const next = [...list];
  next[index] = customer;
  return next;
}

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await customersApi.list();
      setCustomers(items.map(mapCustomerFromDto));
    } catch (err) {
      setError(getErrorMessage(err));
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load from backend on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void refreshCustomers();
  }, [refreshCustomers]);

  const addCustomer = useCallback(
    async (data: CustomerFormData, _stages?: SettingsStage[]): Promise<Customer> => {
      void _stages;
      const created = await customersApi.create(mapFormToCreateBody(data));
      const customer = mapCustomerFromDto(created);
      setCustomers((prev) => [customer, ...prev]);
      return customer;
    },
    []
  );

  const updateCustomer = useCallback(async (id: string, data: CustomerFormData) => {
    const updated = await customersApi.update(id, mapFormToUpdateBody(data));
    const customer = mapCustomerFromDto(updated);
    setCustomers((prev) => upsertCustomer(prev, customer));
  }, []);

  const changeCustomerStage = useCallback(
    async (id: string, payload: StageChangePayload, _stages: SettingsStage[]) => {
      void _stages;
      const updated = await customersApi.changeStage(id, payload);
      const customer = mapCustomerFromDto(updated);
      setCustomers((prev) => upsertCustomer(prev, customer));
    },
    []
  );

  const updateRecordType = useCallback(
    async (id: string, recordType: RecordType, _stages: SettingsStage[]) => {
      void _stages;
      const updated = await customersApi.changeRecordType(id, recordType);
      const customer = mapCustomerFromDto(updated);
      setCustomers((prev) => upsertCustomer(prev, customer));
    },
    []
  );

  const getCustomer = useCallback(
    (id: string) => customers.find((c) => c.id === id),
    [customers]
  );

  const value = useMemo(
    () => ({
      customers,
      loading,
      error,
      refreshCustomers,
      addCustomer,
      updateCustomer,
      changeCustomerStage,
      updateRecordType,
      getCustomer,
    }),
    [
      customers,
      loading,
      error,
      refreshCustomers,
      addCustomer,
      updateCustomer,
      changeCustomerStage,
      updateRecordType,
      getCustomer,
    ]
  );

  return (
    <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>
  );
}
