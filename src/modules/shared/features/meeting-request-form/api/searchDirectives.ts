import { getAuthToken } from "@/modules/auth/utils/tokenGetter";

const APP_BASE =
  (import.meta.env.VITE_APP_BASE_URL_MINISTER as string) ||
  "https://execution-system.momrahai.com";
const BASE = `${APP_BASE.replace(/\/$/, "")}/api`;

export interface DirectiveSearchResult {
  id: string;
  title: string;
  status?: string;
  scheduling_officer_status?: string;
  created_at?: string;
  updated_at?: string;
}

interface ListDirectivesApiResponse {
  items?: DirectiveSearchResult[];
}

export async function searchDirectives(
  skip: number,
  limit: number,
): Promise<{ items: DirectiveSearchResult[]; hasMore: boolean; total: number }> {
  const url = new URL(`${BASE}/minister-directives`);
  url.searchParams.set("skip", String(skip));
  url.searchParams.set("limit", String(limit));

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const token = await getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), { method: "GET", headers });

  if (!res.ok) {
    throw new Error(`Minister directives list error: ${res.status}`);
  }

  const data: ListDirectivesApiResponse | DirectiveSearchResult[] = await res.json();
  const items: DirectiveSearchResult[] = Array.isArray(data)
    ? data
    : data.items ?? [];

  return {
    items,
    hasMore: items.length >= limit,
    total: items.length,
  };
}
