import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { addToOutbox, generateIdempotencyKeys, getCachedTrucks, setCachedTrucks, upsertCachedTruck } from "@/lib/offline-store";
import type { Location, Truck, PriceRule, ExpenseCategory, Expense, SaleTrip } from "@shared/schema";

const addItemToQueryCache = <T extends { id: string }>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: string,
  item: T,
) => {
  queryClient.setQueriesData({ queryKey: [queryKey] }, (oldData: unknown) => {
    if (!Array.isArray(oldData)) return oldData;
    return [item, ...oldData] as T[];
  });
};

const updateItemInQueryCache = <T extends { id: string }>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: string,
  id: string,
  updates: Partial<T>,
) => {
  queryClient.setQueriesData({ queryKey: [queryKey] }, (oldData: unknown) => {
    if (!Array.isArray(oldData)) return oldData;
    return (oldData as T[]).map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    );
  });
};

const removeItemFromQueryCache = <T extends { id: string }>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: string,
  id: string,
) => {
  queryClient.setQueriesData({ queryKey: [queryKey] }, (oldData: unknown) => {
    if (!Array.isArray(oldData)) return oldData;
    return (oldData as T[]).filter((item) => item.id !== id);
  });
};

export function useLocations() {
  return useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });
}

export function useLocation(id: string | undefined) {
  return useQuery<Location>({
    queryKey: ["/api/locations", id],
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; note?: string; isActive?: boolean }) => {
      const res = await apiRequest("POST", "/api/locations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; note?: string; isActive?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/locations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    },
  });
}

export function useTrucks(search?: string) {
  const queryKey = search ? ["/api/trucks", { search }] : ["/api/trucks"];
  return useQuery<Truck[]>({
    queryKey,
    queryFn: async () => {
      if (!navigator.onLine) {
        const cached = await getCachedTrucks();
        if (!search) return cached;
        const term = search.toLowerCase();
        return cached.filter((truck) =>
          truck.plateNumber.toLowerCase().includes(term) ||
          (truck.contactName ?? "").toLowerCase().includes(term)
        );
      }
      const url = search ? `/api/trucks?search=${encodeURIComponent(search)}` : "/api/trucks";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const cached = await getCachedTrucks();
        if (!search) return cached;
        const term = search.toLowerCase();
        return cached.filter((truck) =>
          truck.plateNumber.toLowerCase().includes(term) ||
          (truck.contactName ?? "").toLowerCase().includes(term)
        );
      }
      const data = await res.json();
      if (!search) {
        await setCachedTrucks(data);
      }
      return data;
    },
  });
}

export function useTruck(id: string | undefined) {
  return useQuery<Truck>({
    queryKey: ["/api/trucks", id],
    enabled: !!id,
  });
}

export function useTruckSummary(id: string | undefined, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["/api/trucks", id, "summary", dateFrom, dateTo],
    queryFn: async () => {
      let url = `/api/trucks/${id}/summary`;
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch truck summary");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateTruck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { plateNumber: string; contactName?: string; contactPhone?: string; note?: string; isActive?: boolean }) => {
      if (!navigator.onLine) {
        const keys = generateIdempotencyKeys();
        const body = { ...data, ...keys };
        await addToOutbox({
          entityType: "truck",
          action: "create",
          url: "/api/trucks",
          method: "POST",
          body,
          clientId: keys.clientId,
          clientCreatedAt: keys.clientCreatedAt,
        });
        const optimisticTruck: Truck = {
          id: `offline-${crypto.randomUUID()}`,
          plateNumber: data.plateNumber,
          contactName: data.contactName ?? null,
          contactPhone: data.contactPhone ?? null,
          note: data.note ?? null,
          isActive: data.isActive ?? true,
        };
        await upsertCachedTruck(optimisticTruck);
        addItemToQueryCache<Truck>(queryClient, "/api/trucks", optimisticTruck);
        return optimisticTruck;
      }
      const res = await apiRequest("POST", "/api/trucks", data);
      const created = await res.json();
      await upsertCachedTruck(created);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
    },
  });
}

export function useUpdateTruck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; plateNumber?: string; contactName?: string; contactPhone?: string; note?: string; isActive?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/trucks/${id}`, data);
      const updated = await res.json();
      const cached = await getCachedTrucks();
      const next = cached.filter((truck) => truck.id !== updated.id);
      next.push(updated);
      await setCachedTrucks(next);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
    },
  });
}

export function useDeleteTruck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/trucks/${id}`);
      const cached = await getCachedTrucks();
      const next = cached.filter((truck) => truck.id !== id);
      await setCachedTrucks(next);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
    },
  });
}

export function usePriceRules(locationId?: string) {
  return useQuery<PriceRule[]>({
    queryKey: locationId ? ["/api/price-rules", { locationId }] : ["/api/price-rules"],
    queryFn: async () => {
      const url = locationId ? `/api/price-rules?locationId=${locationId}` : "/api/price-rules";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch price rules");
      return res.json();
    },
  });
}

export function useResolvePrice(locationId: string | undefined, date: string | undefined) {
  return useQuery<{ price: number }>({
    queryKey: ["/api/price-rules/resolve", locationId, date],
    queryFn: async () => {
      const res = await fetch(`/api/price-rules/resolve?locationId=${locationId}&date=${date}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to resolve price");
      return res.json();
    },
    enabled: !!locationId && !!date,
  });
}

export function useCreatePriceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { locationId: string; pricePerTrip: number; startDate: string; endDate?: string; note?: string; isActive?: boolean }) => {
      const res = await apiRequest("POST", "/api/price-rules", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-rules"] });
    },
  });
}

export function useUpdatePriceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; locationId?: string; pricePerTrip?: number; startDate?: string; endDate?: string; note?: string; isActive?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/price-rules/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-rules"] });
    },
  });
}

export function useDeletePriceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/price-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-rules"] });
    },
  });
}

export function useExpenseCategories() {
  return useQuery<ExpenseCategory[]>({
    queryKey: ["/api/expense-categories"],
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; type: "OPERATIONAL" | "PAYABLE" | "LOAN"; isActive?: boolean }) => {
      const res = await apiRequest("POST", "/api/expense-categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; type?: "OPERATIONAL" | "PAYABLE" | "LOAN"; isActive?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/expense-categories/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/expense-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-categories"] });
    },
  });
}

interface ExpenseFilters {
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery<Expense[]>({
    queryKey: ["/api/expenses", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.locationId) params.set("locationId", filters.locationId);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      const url = params.toString() ? `/api/expenses?${params.toString()}` : "/api/expenses";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
  });
}

export function useExpenseSummary(locationId: string | null, dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["/api/expenses/summary", locationId, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);
      params.set("dateFrom", dateFrom);
      params.set("dateTo", dateTo);
      const res = await fetch(`/api/expenses/summary?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expense summary");
      return res.json();
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { locationId: string; expenseDate: string; amount: number; categoryId: string; note?: string; relatedPlateNumber?: string }) => {
      if (!navigator.onLine) {
        const keys = generateIdempotencyKeys();
        const body = { ...data, ...keys };
        await addToOutbox({
          entityType: "expense",
          action: "create",
          url: "/api/expenses",
          method: "POST",
          body,
          clientId: keys.clientId,
          clientCreatedAt: keys.clientCreatedAt,
        });
        const optimisticExpense: Expense = {
          id: `offline-${crypto.randomUUID()}`,
          locationId: data.locationId,
          expenseDate: data.expenseDate,
          amount: data.amount,
          categoryId: data.categoryId,
          note: data.note ?? null,
          saleTripId: null,
          relatedPlateNumber: data.relatedPlateNumber ?? null,
          clientId: keys.clientId,
          clientCreatedAt: new Date(keys.clientCreatedAt),
          createdAt: new Date(),
        };
        addItemToQueryCache<Expense>(queryClient, "/api/expenses", optimisticExpense);
        return optimisticExpense;
      }
      const res = await apiRequest("POST", "/api/expenses", data);
      return res.json();
    },
    onSuccess: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports/summary"] });
      }
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; locationId?: string; expenseDate?: string; amount?: number; categoryId?: string; note?: string; relatedPlateNumber?: string }) => {
      if (!navigator.onLine) {
        const keys = generateIdempotencyKeys();
        await addToOutbox({
          entityType: "expense",
          action: "update",
          url: `/api/expenses/${id}`,
          method: "PATCH",
          body: { ...data },
          clientId: keys.clientId,
          clientCreatedAt: keys.clientCreatedAt,
        });
        updateItemInQueryCache<Expense>(queryClient, "/api/expenses", id, data);
        return { id, ...data } as Expense;
      }
      const res = await apiRequest("PATCH", `/api/expenses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports/summary"] });
      }
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        const keys = generateIdempotencyKeys();
        await addToOutbox({
          entityType: "expense",
          action: "delete",
          url: `/api/expenses/${id}`,
          method: "DELETE",
          body: {},
          clientId: keys.clientId,
          clientCreatedAt: keys.clientCreatedAt,
        });
        removeItemFromQueryCache<Expense>(queryClient, "/api/expenses", id);
        return;
      }
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports/summary"] });
      }
    },
  });
}

interface SaleTripFilters {
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
  plateNumber?: string;
  paymentStatus?: string;
}

export function useSaleTrips(filters: SaleTripFilters = {}) {
  return useQuery<SaleTrip[]>({
    queryKey: ["/api/sale-trips", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.locationId) params.set("locationId", filters.locationId);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.plateNumber) params.set("plateNumber", filters.plateNumber);
      if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
      const url = params.toString() ? `/api/sale-trips?${params.toString()}` : "/api/sale-trips";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sale trips");
      return res.json();
    },
  });
}

export function useSaleSummary(locationId: string | null, dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["/api/sale-trips/summary", locationId, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);
      params.set("dateFrom", dateFrom);
      params.set("dateTo", dateTo);
      const res = await fetch(`/api/sale-trips/summary?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sale summary");
      return res.json();
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

export function useCreateSaleTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      locationId: string;
      transDate: string;
      plateNumber: string;
      basePrice?: number;
      appliedPrice?: number;
      paymentStatus?: "PAID" | "PARTIAL" | "UNPAID";
      paidAmount?: number;
      paymentMethod?: "CASH" | "TRANSFER" | "QRIS" | "OTHER";
      note?: string;
    }) => {
      if (!navigator.onLine) {
        const keys = generateIdempotencyKeys();
        const body = { ...data, ...keys };
        await addToOutbox({
          entityType: "saleTrip",
          action: "create",
          url: "/api/sale-trips",
          method: "POST",
          body,
          clientId: keys.clientId,
          clientCreatedAt: keys.clientCreatedAt,
        });
        const optimisticTrip: SaleTrip = {
          id: `offline-${crypto.randomUUID()}`,
          locationId: data.locationId,
          transDate: data.transDate,
          plateNumber: data.plateNumber,
          basePrice: data.basePrice ?? data.appliedPrice ?? 0,
          appliedPrice: data.appliedPrice ?? data.basePrice ?? 0,
          paymentStatus: data.paymentStatus ?? "PAID",
          paidAmount: data.paidAmount ?? 0,
          paymentMethod: data.paymentMethod ?? null,
          note: data.note ?? null,
          clientId: keys.clientId,
          clientCreatedAt: new Date(keys.clientCreatedAt),
          createdAt: new Date(),
        };
        addItemToQueryCache<SaleTrip>(queryClient, "/api/sale-trips", optimisticTrip);
        return optimisticTrip;
      }
      const res = await apiRequest("POST", "/api/sale-trips", data);
      return res.json();
    },
    onSuccess: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ["/api/sale-trips"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports/summary"] });
      }
    },
  });
}

export function useUpdateSaleTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      locationId?: string;
      transDate?: string;
      plateNumber?: string;
      basePrice?: number;
      appliedPrice?: number;
      paymentStatus?: "PAID" | "PARTIAL" | "UNPAID";
      paidAmount?: number;
      paymentMethod?: "CASH" | "TRANSFER" | "QRIS" | "OTHER";
      note?: string;
    }) => {
      if (!navigator.onLine) {
        const keys = generateIdempotencyKeys();
        await addToOutbox({
          entityType: "saleTrip",
          action: "update",
          url: `/api/sale-trips/${id}`,
          method: "PATCH",
          body: { ...data },
          clientId: keys.clientId,
          clientCreatedAt: keys.clientCreatedAt,
        });
        updateItemInQueryCache<SaleTrip>(queryClient, "/api/sale-trips", id, data);
        return { id, ...data } as SaleTrip;
      }
      const res = await apiRequest("PATCH", `/api/sale-trips/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ["/api/sale-trips"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports/summary"] });
      }
    },
  });
}

export function useDeleteSaleTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        const keys = generateIdempotencyKeys();
        await addToOutbox({
          entityType: "saleTrip",
          action: "delete",
          url: `/api/sale-trips/${id}`,
          method: "DELETE",
          body: {},
          clientId: keys.clientId,
          clientCreatedAt: keys.clientCreatedAt,
        });
        removeItemFromQueryCache<SaleTrip>(queryClient, "/api/sale-trips", id);
        return;
      }
      await apiRequest("DELETE", `/api/sale-trips/${id}`);
    },
    onSuccess: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ["/api/sale-trips"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports/summary"] });
      }
    },
  });
}

type TimePreset = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_MONTH";

interface ReportsSummary {
  dateFrom: string;
  dateTo: string;
  sales: {
    totalTrips: number;
    grossRevenue: number;
    totalDiscounts: number;
    netRevenue: number;
    cashCollected: number;
    receivables: number;
  };
  expenses: {
    totalOperational: number;
    totalPayable: number;
    totalLoan: number;
    totalDiscount: number;
  };
}

export function useReportsSummary(preset?: TimePreset, locationId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery<ReportsSummary>({
    queryKey: ["/api/reports/summary", preset, locationId, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (preset) params.set("preset", preset);
      if (locationId) params.set("locationId", locationId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const url = params.toString() ? `/api/reports/summary?${params.toString()}` : "/api/reports/summary";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports summary");
      return res.json();
    },
  });
}

interface DefaultLocationResponse {
  defaultLocationId: string | null;
}

export function useDefaultLocation() {
  return useQuery<DefaultLocationResponse>({
    queryKey: ["/api/settings/default-location"],
  });
}

export function useSetDefaultLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (locationId: string) => {
      const res = await apiRequest("PUT", "/api/settings/default-location", { locationId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/default-location"] });
    },
  });
}
