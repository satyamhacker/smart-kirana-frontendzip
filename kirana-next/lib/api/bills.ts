"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "./fetch";
import type { Bill, BillInput } from "./types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export function getListBillsQueryKey() {
  return ["bills", "list"] as const;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

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
