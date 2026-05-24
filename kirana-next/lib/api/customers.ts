"use client";

import { useQuery, useMutation, type UseQueryOptions } from "@tanstack/react-query";
import { apiFetch } from "./fetch";
import type { Customer, CustomerDetail, KhataTransaction } from "./types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export function getListCustomersQueryKey(params?: { search?: string }) {
  return ["customers", "list", params ?? {}] as const;
}

export function getGetCustomerQueryKey(id: number) {
  return ["customers", "detail", id] as const;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

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

export function useGetCustomer(
  id: number,
  options?: { query?: Partial<UseQueryOptions<CustomerDetail | null>> },
) {
  return useQuery({
    queryKey: getGetCustomerQueryKey(id),
    queryFn: () => apiFetch<CustomerDetail>(`/api/customers/${id}`),
    ...options?.query,
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
