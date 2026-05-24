"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiFetch } from "./fetch";
import type { SalesReport, ProfitReport, KhataReport, Product } from "./types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export function getGetSalesReportQueryKey(params?: { period?: string; from?: string; to?: string }) {
  return ["reports", "sales", params ?? {}] as const;
}

export function getGetProfitReportQueryKey(params?: { from?: string; to?: string }) {
  return ["reports", "profit", params ?? {}] as const;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useGetSalesReport(
  params: { period?: string; from?: string; to?: string },
  options?: { query?: Partial<UseQueryOptions<SalesReport>> },
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
  options?: { query?: Partial<UseQueryOptions<ProfitReport>> },
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
      apiFetch<any[]>("/api/reports/lowstock").then((rows) =>
        rows.map((r) => ({
          ...r,
          purchasePrice: r.buyingPrice ?? 0,
          sellingPrice: r.sellingPrice ?? 0,
          lowStockThreshold: r.minStockLevel ?? r.lowStockThreshold ?? 5,
        })),
      ),
  });
}
