"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "./fetch";
import type { Product } from "./types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export function getListProductsQueryKey(params?: { search?: string; lowStock?: boolean }) {
  return ["products", "list", params ?? {}] as const;
}

// ─── Normalizer (API returns buyingPrice/minStockLevel aliases) ───────────────

function normalizeProduct(r: any): Product {
  return {
    ...r,
    purchasePrice: r.buyingPrice ?? r.purchasePrice ?? 0,
    sellingPrice: r.sellingPrice ?? 0,
    lowStockThreshold: r.minStockLevel ?? r.lowStockThreshold ?? 5,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListProducts(params?: { search?: string; lowStock?: boolean }) {
  return useQuery({
    queryKey: getListProductsQueryKey(params),
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.lowStock) q.set("lowStock", "true");
      return apiFetch<any[]>(`/api/products${q.toString() ? `?${q}` : ""}`).then((rows) =>
        rows.map(normalizeProduct),
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
