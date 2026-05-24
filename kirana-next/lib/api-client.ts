"use client";

import { useQuery, useMutation, type UseQueryOptions } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Product = {
  id: number;
  name: string;
  barcode?: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
  createdAt: string;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  address?: string;
  totalDue: number;
  createdAt: string;
};

export type CustomerDetail = Customer & {
  transactions: KhataTransaction[];
};

export type KhataTransaction = {
  id: number;
  type: "credit" | "payment";
  amount: number;
  description: string;
  createdAt: string;
};

export type BillInputPaymentMode = "cash" | "upi" | "khata";

export type BillItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type BillInput = {
  customerId?: number;
  items: BillItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMode: BillInputPaymentMode;
};

export type Bill = {
  id: number;
  customerId?: number;
  customerName?: string;
  items: BillItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMode: BillInputPaymentMode;
  createdAt: string;
};

export type DashboardSummary = {
  todaySale: number;
  todayProfit: number;
  todayOrderCount: number;
  pendingKhataAmount: number;
  pendingKhataCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentBills: {
    id: number;
    customerName?: string;
    finalAmount: number;
    paymentMode: BillInputPaymentMode;
    createdAt: string;
  }[];
  lowStockProducts: {
    id: number;
    name: string;
    category: string;
    currentStock: number;
    lowStockThreshold: number;
    unit: string;
  }[];
};

// ─── Fetch Helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export function getListProductsQueryKey(params?: { search?: string }) {
  return ["products", "list", params ?? {}] as const;
}

export function getGetDashboardSummaryQueryKey() {
  return ["dashboard", "summary"] as const;
}

export function getListBillsQueryKey() {
  return ["bills", "list"] as const;
}

export function getListCustomersQueryKey(params?: { search?: string }) {
  return ["customers", "list", params ?? {}] as const;
}

export function getGetCustomerQueryKey(id: number) {
  return ["customers", "detail", id] as const;
}

export function getGetSalesReportQueryKey(params?: { period?: string; from?: string; to?: string }) {
  return ["reports", "sales", params ?? {}] as const;
}

export function getGetProfitReportQueryKey(params?: { from?: string; to?: string }) {
  return ["reports", "profit", params ?? {}] as const;
}

// ─── Product Hooks ────────────────────────────────────────────────────────────

export function useListProducts(params?: { search?: string; lowStock?: boolean }) {
  return useQuery({
    queryKey: getListProductsQueryKey(params),
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.lowStock) q.set("lowStock", "true");
      return apiFetch<Product[]>(`/api/products${q.toString() ? `?${q}` : ""}`).then(rows =>
        rows.map(r => ({
          ...r,
          purchasePrice: (r as any).buyingPrice ?? r.purchasePrice ?? 0,
          sellingPrice: (r as any).sellingPrice ?? 0,
          lowStockThreshold: (r as any).minStockLevel ?? r.lowStockThreshold ?? 5,
        }))
      );
    },
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async ({ data }: { data: Omit<Product, "id" | "createdAt"> }) =>
      apiFetch<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          unit: data.unit,
          buyingPrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          currentStock: data.currentStock,
          minStockLevel: data.lowStockThreshold,
          barcode: data.barcode,
        }),
      }),
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<Product, "id" | "createdAt"> }) =>
      apiFetch<Product>(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          unit: data.unit,
          buyingPrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          currentStock: data.currentStock,
          minStockLevel: data.lowStockThreshold,
          barcode: data.barcode,
        }),
      }),
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) =>
      apiFetch<{ ok: boolean }>(`/api/products/${id}`, { method: "DELETE" }),
  });
}

// ─── Customer Hooks ───────────────────────────────────────────────────────────

export function useListCustomers(params?: { search?: string }) {
  return useQuery({
    queryKey: getListCustomersQueryKey(params),
    queryFn: () => {
      const url = params?.search
        ? `/api/customers?search=${encodeURIComponent(params.search)}`
        : "/api/customers";
      return apiFetch<Customer[]>(url);
    },
  });
}

export function useCreateCustomer() {
  return useMutation({
    mutationFn: async ({ data }: { data: { name: string; phone: string; address?: string } }) =>
      apiFetch<Customer>("/api/customers", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useDeleteCustomer() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) =>
      apiFetch<{ ok: boolean }>(`/api/customers/${id}`, { method: "DELETE" }),
  });
}

export function useGetCustomer(
  id: number,
  options?: { query?: Partial<UseQueryOptions<CustomerDetail | null>> }
) {
  return useQuery({
    queryKey: getGetCustomerQueryKey(id),
    queryFn: () => apiFetch<CustomerDetail>(`/api/customers/${id}`),
    ...options?.query,
  });
}

export function useAddKhataTransaction() {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { type: "credit" | "payment"; amount: number; description: string };
    }) =>
      apiFetch<KhataTransaction>(`/api/customers/${id}/transactions`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// ─── Bill Hooks ───────────────────────────────────────────────────────────────

export function useListBills() {
  return useQuery({
    queryKey: getListBillsQueryKey(),
    queryFn: () => apiFetch<Bill[]>("/api/bills"),
  });
}

export function useCreateBill() {
  return useMutation({
    mutationFn: async ({ data }: { data: BillInput }) =>
      apiFetch<Bill>("/api/bills", { method: "POST", body: JSON.stringify(data) }),
  });
}

// ─── Dashboard Hook ───────────────────────────────────────────────────────────

export function useGetDashboardSummary() {
  return useQuery({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: () => apiFetch<DashboardSummary>("/api/dashboard"),
  });
}

// ─── Report Hooks ─────────────────────────────────────────────────────────────

type SalesReport = {
  totalSales: number;
  orderCount: number;
  data: { date: string; sales: number; orders: number }[];
};

type ProfitReport = {
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  data: { date: string; revenue: number; profit: number }[];
};

type KhataReport = {
  totalPending: number;
  customerCount: number;
  customers: { id: number; name: string; phone: string; totalDue: number }[];
};

export function useGetSalesReport(
  params: { period?: string; from?: string; to?: string },
  options?: { query?: Partial<UseQueryOptions<SalesReport>> }
) {
  return useQuery<SalesReport>({
    queryKey: getGetSalesReportQueryKey(params),
    queryFn: () => {
      const q = new URLSearchParams();
      if (params.from) q.set("from", params.from);
      if (params.to) q.set("to", params.to);
      if (params.period) q.set("period", params.period);
      return apiFetch<SalesReport>(`/api/reports/sales?${q}`);
    },
    ...options?.query,
  });
}

export function useGetProfitReport(
  params: { from?: string; to?: string },
  options?: { query?: Partial<UseQueryOptions<ProfitReport>> }
) {
  return useQuery<ProfitReport>({
    queryKey: getGetProfitReportQueryKey(params),
    queryFn: () => {
      const q = new URLSearchParams();
      if (params.from) q.set("from", params.from);
      if (params.to) q.set("to", params.to);
      return apiFetch<ProfitReport>(`/api/reports/profit?${q}`);
    },
    ...options?.query,
  });
}

export function useGetPendingKhataReport() {
  return useQuery<KhataReport>({
    queryKey: ["reports", "khata"],
    queryFn: () => apiFetch<KhataReport>("/api/reports/khata"),
  });
}

export function useGetLowStockReport() {
  return useQuery<Product[]>({
    queryKey: ["reports", "lowstock"],
    queryFn: () =>
      apiFetch<Product[]>("/api/reports/lowstock").then(rows =>
        rows.map(r => ({
          ...r,
          purchasePrice: (r as any).buyingPrice ?? 0,
          sellingPrice: (r as any).sellingPrice ?? 0,
          lowStockThreshold: (r as any).minStockLevel ?? (r as any).lowStockThreshold ?? 5,
        }))
      ),
  });
}
