// ─── Base Fetch Helper ─────────────────────────────────────────────────────────

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.message ?? text;
    } catch {}
    throw new Error(`API ${res.status}: ${message}`);
  }
  return res.json() as Promise<T>;
}
