import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  raw?: boolean; // skip JSON.stringify and Content-Type for FormData
}

/**
 * Centralized API client that injects the current Supabase JWT into every request
 * and handles 401 responses by signing the user out.
 */
export async function apiCall<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!options.raw) headers["Content-Type"] = "application/json";
  if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

  const init: RequestInit = {
    ...options,
    headers,
    body: options.raw ? (options.body as BodyInit) : options.body ? JSON.stringify(options.body) : undefined,
  };

  const res = await fetch(url, init);

  if (res.status === 401) {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${txt || res.statusText}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return (await res.text()) as unknown as T;
}

/**
 * Helper for cases that still need raw fetch but with auth headers.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export const API_URL = API_BASE_URL;
