/**
 * Minister directives API client.
 * Base path: /api/minister-directives
 * Uses VITE_APP_BASE_URL_MINISTER + /api and Bearer token (minister-mind auth).
 */

import { getAuthToken } from "@/modules/auth/utils/tokenGetter";

const APP_BASE =
  (import.meta.env.VITE_APP_BASE_URL_MINISTER as string) ||
  "https://execution-system.momrahai.com";
const BASE = `${APP_BASE.replace(/\/$/, "")}/api/`;

function getBaseUrl(): string {
  return BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
}

async function getHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const token = await getAuthToken();
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export type DirectiveStatus = "TAKEN" | "ADOPTED";
export type SchedulingOfficerStatus = "OPEN" | "CLOSED";

export interface MinisterDirective {
  id: string;
  title: string;
  status: DirectiveStatus;
  scheduling_officer_status: SchedulingOfficerStatus;
  created_at: string;
  updated_at: string;
}

export const DIRECTIVE_STATUS_AR: Record<DirectiveStatus, string> = {
  TAKEN: "تم الاخذ بالتوجيه",
  ADOPTED: "تم اعتماد التوجيه",
};

export interface ListDirectivesParams {
  skip?: number;
  limit?: number;
  status?: DirectiveStatus;
}

export interface ListDirectivesResponse {
  items: MinisterDirective[];
  total?: number;
  skip?: number;
  limit?: number;
}

export async function listMinisterDirectives(
  params: ListDirectivesParams = {}
): Promise<MinisterDirective[]> {
  const base = getBaseUrl();
  const url = new URL("minister-directives", base + "/");
  if (params.skip != null) url.searchParams.set("skip", String(params.skip));
  if (params.limit != null) url.searchParams.set("limit", String(params.limit));
  if (params.status) url.searchParams.set("status", params.status);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: await getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Minister directives list error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`
    );
  }

  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && typeof data.items === "object" && Array.isArray(data.items))
    return data.items;
  return [];
}

export async function getMinisterDirective(
  directiveId: string
): Promise<MinisterDirective> {
  const base = getBaseUrl();
  const url = `${base}/minister-directives/${encodeURIComponent(directiveId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: await getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Minister directive get error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`
    );
  }

  return res.json();
}

export interface CreateDirectiveBody {
  title: string;
  status?: DirectiveStatus;
  /** Optional; default OPEN. Omit (do not send) when not setting. */
  scheduling_officer_status?: SchedulingOfficerStatus;
}

export async function createMinisterDirective(
  body: CreateDirectiveBody
): Promise<MinisterDirective> {
  const base = getBaseUrl();
  const url = `${base}/minister-directives`;
  const payload: Record<string, unknown> = {
    title: body.title,
  };
  if (body.status != null) {
    payload.status = body.status;
  }
  if (body.scheduling_officer_status != null) {
    payload.scheduling_officer_status = body.scheduling_officer_status;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Minister directive create error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`
    );
  }

  return res.json();
}

export interface PatchDirectiveBody {
  title?: string;
  status?: DirectiveStatus;
  scheduling_officer_status?: SchedulingOfficerStatus;
}

export async function patchMinisterDirective(
  directiveId: string,
  body: PatchDirectiveBody
): Promise<MinisterDirective> {
  const base = getBaseUrl();
  const url = `${base}/minister-directives/${encodeURIComponent(directiveId)}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: await getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Minister directive patch error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`
    );
  }

  return res.json();
}

/** Request meeting: sets scheduling_officer_status = CLOSED, status = ADOPTED. Returns updated directive. */
export async function requestMeeting(
  directiveId: string
): Promise<MinisterDirective> {
  const base = getBaseUrl();
  const url = `${base}/minister-directives/${encodeURIComponent(directiveId)}/request-meeting`;

  const res = await fetch(url, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Request meeting error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`
    );
  }

  return res.json();
}

/** Take directive: sets scheduling_officer_status = CLOSED, status = TAKEN (no meeting created). Returns updated directive. */
export async function takeDirective(
  directiveId: string
): Promise<MinisterDirective> {
  const base = getBaseUrl();
  const url = `${base}/minister-directives/${encodeURIComponent(directiveId)}/take-directive`;

  const res = await fetch(url, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Take directive error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`
    );
  }

  return res.json();
}
