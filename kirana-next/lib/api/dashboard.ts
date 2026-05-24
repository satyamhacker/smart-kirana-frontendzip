"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./fetch";
import type { DashboardSummary } from "./types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export function getGetDashboardSummaryQueryKey() {
  return ["dashboard", "summary"] as const;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useGetDashboardSummary() {
  return useQuery({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: () => apiFetch<DashboardSummary>("/api/dashboard"),
  });
}
