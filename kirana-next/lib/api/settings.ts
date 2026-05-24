"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "./fetch";
import type { AppSettings } from "./types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export function getSettingsQueryKey() {
  return ["settings"] as const;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useGetSettings() {
  return useQuery<AppSettings>({
    queryKey: getSettingsQueryKey(),
    queryFn: () => apiFetch<AppSettings>("/api/settings"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: async ({ data }: { data: Partial<AppSettings> }) =>
      apiFetch<{ success: boolean }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });
}
