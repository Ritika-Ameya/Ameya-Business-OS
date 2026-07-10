import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { seedCustomers } from "@/features/customers/data/seed-customers";
import { seedSettingsStages } from "@/features/settings/data/seed-settings";
import {
  getDefaultStageForRecordType,
  getStageById,
  resolveRecordTypeFromStage,
} from "@/features/customers/utils/stage-utils";
import { addActivity } from "@/shared/utils/activity-store";
import type {
  Customer,
  CustomerFormData,
  CustomerTimelineEntry,
  RecordType,
} from "@/features/customers/types/customer";
import type { SettingsStage } from "@/features/settings/types/settings";

const STORAGE_KEY = "ameya-customers";

export interface StageChangePayload {
  stageId: string;
  nextActionDate?: string;
  notes?: string;
}

interface CustomersContextValue {
  customers: Customer[];
  addCustomer: (data: CustomerFormData, stages?: SettingsStage[]) => Customer;
  updateCustomer: (id: string, data: CustomerFormData) => void;
  changeCustomerStage: (
    id: string,
    payload: StageChangePayload,
    stages: SettingsStage[]
  ) => void;
  updateRecordType: (id: string, recordType: RecordType, stages: SettingsStage[]) => void;
  getCustomer: (id: string) => Customer | undefined;
}

const CustomersContext = createContext<CustomersContextValue | null>(null);

export { CustomersContext };

function normalizeCustomer(customer: Customer, stages = seedSettingsStages): Customer {
  const recordType = customer.recordType ?? "customer";
  const defaultStage = getDefaultStageForRecordType(stages, recordType);
  const currentStageId = customer.currentStageId ?? defaultStage?.id;

  return {
    ...customer,
    billingAddress: customer.billingAddress ?? customer.address,
    serviceAddress: customer.serviceAddress ?? customer.billingAddress ?? customer.address,
    recordType,
    currentStageId,
    timeline: customer.timeline ?? [],
  };
}

function loadCustomers(): Customer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return (JSON.parse(stored) as Customer[]).map((customer) =>
        normalizeCustomer(customer)
      );
    }
  } catch {
    // fall through to seed data
  }
  return seedCustomers.map((customer) => normalizeCustomer(customer));
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
    recordType: data.recordType,
  };
}

function createTimelineEntry(
  stage: SettingsStage,
  notes?: string,
  nextActionDate?: string
): CustomerTimelineEntry {
  return {
    id: `tl-${crypto.randomUUID().slice(0, 8)}`,
    stageId: stage.id,
    stageName: stage.name,
    notes: notes?.trim() || undefined,
    nextActionDate,
    timestamp: new Date().toISOString(),
  };
}

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(loadCustomers);

  const addCustomer = useCallback(
    (data: CustomerFormData, stages: SettingsStage[] = seedSettingsStages): Customer => {
      const recordType = data.recordType;
      const defaultStage = getDefaultStageForRecordType(stages, recordType);
      const resolvedRecordType = defaultStage
        ? resolveRecordTypeFromStage(recordType, defaultStage)
        : recordType;

      const customer: Customer = {
        id: `cust-${crypto.randomUUID().slice(0, 8)}`,
        ...formToCustomerFields(data),
        recordType: resolvedRecordType,
        currentStageId: defaultStage?.id,
        timeline: defaultStage
          ? [createTimelineEntry(defaultStage, data.notes.trim() || undefined)]
          : [],
        status: resolvedRecordType === "customer" ? "active" : "prospect",
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

      addActivity({
        entityType: "customer",
        entityId: customer.id,
        action: "record_created",
        title: `${resolvedRecordType === "opportunity" ? "Opportunity" : "Customer"} created`,
        description: customer.company || customer.name,
        notes: data.notes.trim() || undefined,
        customerId: customer.id,
      });

      if (defaultStage) {
        addActivity({
          entityType: "customer",
          entityId: customer.id,
          action: "stage_changed",
          title: `Stage set to ${defaultStage.name}`,
          relatedRecord: defaultStage.name,
          customerId: customer.id,
        });
      }

      return customer;
    },
    []
  );

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

  const changeCustomerStage = useCallback(
    (id: string, payload: StageChangePayload, stages: SettingsStage[]) => {
      const stage = getStageById(stages, payload.stageId);
      if (!stage) return;

      setCustomers((prev) => {
        const next = prev.map((customer) => {
          if (customer.id !== id) return customer;

          const recordType = resolveRecordTypeFromStage(customer.recordType, stage);
          const timelineEntry = createTimelineEntry(
            stage,
            payload.notes,
            payload.nextActionDate
          );

          return {
            ...customer,
            currentStageId: stage.id,
            recordType,
            nextActionDate:
              payload.nextActionDate !== undefined
                ? payload.nextActionDate
                : customer.nextActionDate,
            status:
              recordType === "customer" && customer.status === "prospect"
                ? "active"
                : customer.status,
            timeline: [timelineEntry, ...customer.timeline],
          };
        });
        persistCustomers(next);
        return next;
      });

      addActivity({
        entityType: "customer",
        entityId: id,
        action: "stage_changed",
        title: `Stage changed to ${stage.name}`,
        notes: payload.notes,
        relatedRecord: stage.name,
        customerId: id,
      });

      if (payload.nextActionDate) {
        addActivity({
          entityType: "customer",
          entityId: id,
          action: "follow_up_set",
          title: "Follow-up date set",
          description: payload.nextActionDate,
          customerId: id,
        });
      }
    },
    []
  );

  const updateRecordType = useCallback(
    (id: string, recordType: RecordType, stages: SettingsStage[]) => {
      setCustomers((prev) => {
        const next = prev.map((customer) => {
          if (customer.id !== id) return customer;

          const currentStage = getStageById(stages, customer.currentStageId);
          const stageStillApplies =
            currentStage &&
            (currentStage.applicableFor === "both" ||
              currentStage.applicableFor === recordType);

          const nextStageId = stageStillApplies
            ? customer.currentStageId
            : getDefaultStageForRecordType(stages, recordType)?.id;

          return {
            ...customer,
            recordType,
            currentStageId: nextStageId,
            status:
              recordType === "customer" && customer.status === "prospect"
                ? "active"
                : customer.status,
          };
        });
        persistCustomers(next);
        return next;
      });
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
      addCustomer,
      updateCustomer,
      changeCustomerStage,
      updateRecordType,
      getCustomer,
    }),
    [customers, addCustomer, updateCustomer, changeCustomerStage, updateRecordType, getCustomer]
  );

  return (
    <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>
  );
}
