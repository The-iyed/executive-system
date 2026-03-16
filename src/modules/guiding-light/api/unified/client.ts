/**
 * Client for the unified/execution API (minister schedule, etc.).
 * Uses VITE_APP_BASE_URL_MINISTER + /api and Bearer token (minister-mind auth).
 * (x-api-key is only used for VITE_BASE_URL / aoun-api.)
 */

import { getAuthToken } from "@/modules/auth/utils/tokenGetter";

const APP_BASE =
  (import.meta.env.VITE_APP_BASE_URL_MINISTER as string) ||
  "https://execution-system.momrahai.com";
const UNIFIED_BASE = `${APP_BASE.replace(/\/$/, "")}/api/`;

function getBaseUrl(): string {
  return UNIFIED_BASE.endsWith("/") ? UNIFIED_BASE.slice(0, -1) : UNIFIED_BASE;
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

export interface GetMinisterScheduleParams {
  date: string; // YYYY-MM-DD
  view?: "daily" | "weekly" | "monthly";
}

export async function getMinisterSchedule(
  params: GetMinisterScheduleParams
): Promise<import("./types").MinisterScheduleResponse> {
  const base = getBaseUrl();
  const url = new URL("meetings/minister/schedule", base + "/");
  url.searchParams.set("date", params.date);
  url.searchParams.set("view", params.view ?? "daily");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: await getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Minister schedule API error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`);
  }

  return res.json();
}

export interface MeetingAssessmentItem {
  id: string;
  job_id?: string;
  status?: string;
  presentation_id?: string;
  meeting_request_id?: string;
  attachment_id?: string;
  document_id?: string;
  assessment_payload?: AssessmentPayload;
  analysis_payload?: AnalysisPayload;
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentPayload {
  action?: string;
  category?: string;
  is_urgent?: boolean;
  is_important?: boolean;
  rationale?: string;
  total_score?: number;
  meeting_time?: string;
  meeting_title?: string;
  recommendation?: string;
  executive_insight?: string;
  executive_summary?: string;
  urgency_rationale?: string;
  importance_rationale?: string;
  delegation_recommendations?: Array<{ name?: string; role?: string; reason?: string }>;
}

export interface AnalysisResult {
  mode?: string;
  sector?: string;
  datetime?: { start?: string; end?: string; duration_hr?: number };
  document?: string;
  documents?: Array<{
    type?: string;
    title?: string;
    document_id?: string;
    key_takeaway?: string;
    executive_insight?: string;
  }>;
  is_urgent?: boolean;
  is_important?: boolean;
  meeting_title?: string;
  overall_score?: number;
  attendees_count?: number;
  dimension_scores?: Array<{
    dimension?: string;
    score?: number;
    max_score?: number;
    percentage?: number;
    weight?: string;
    comment?: string;
  }>;
  feedback_summary?: {
    strengths?: string[];
    to_improve?: string[];
  };
  reflection_cards?: Record<
    string,
    { summary?: string; details?: string[]; ministerial_insight?: string }
  >;
  related_meetings?: unknown[];
  executive_summary?: string[];
  urgency_rationale?: string;
  importance_rationale?: string;
  attendee_recommendations?: Record<string, unknown>;
  delegation_recommendations?: Array<{ name?: string; role?: string; reason?: string }>;
}

export interface AnalysisPayload {
  result?: AnalysisResult;
  document_id?: string;
  generated_at?: string;
  meeting_date?: string | null;
}

export interface GetMeetingAssessmentsResponse {
  items: MeetingAssessmentItem[];
}

export async function getMeetingAssessments(
  meetingRequestId: string,
  limit = 10
): Promise<GetMeetingAssessmentsResponse> {
  const base = getBaseUrl();
  const url = new URL("meeting-assessments", base + "/");
  url.searchParams.set("meeting_request_id", meetingRequestId);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: await getHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meeting assessments API error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`);
  }

  return res.json();
}

// ─── Meeting request users (GET /api/meeting-requests/users) ───

export interface MeetingRequestUser {
  id: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  role?: string;
  role_code?: string;
  user_type?: "internal" | "external";
}

export interface GetMeetingRequestUsersParams {
  search?: string | null;
  role_code?: string | null;
  role_id?: string | null;
  user_type?: "internal" | "external" | null;
  skip?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export async function getMeetingRequestUsers(
  params: GetMeetingRequestUsersParams = {}
): Promise<PaginatedResponse<MeetingRequestUser>> {
  const base = getBaseUrl();
  const url = new URL("meeting-requests/users", base + "/");
  if (params.search != null && params.search !== "") url.searchParams.set("search", params.search);
  if (params.role_code != null && params.role_code !== "") url.searchParams.set("role_code", params.role_code);
  if (params.role_id != null && params.role_id !== "") url.searchParams.set("role_id", params.role_id);
  if (params.user_type != null) url.searchParams.set("user_type", params.user_type);
  if (params.skip != null) url.searchParams.set("skip", String(params.skip));
  if (params.limit != null) url.searchParams.set("limit", String(Math.min(100, Math.max(1, params.limit))));

  const res = await fetch(url.toString(), { method: "GET", headers: await getHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get users API error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`);
  }
  return res.json();
}

// ─── Meeting request actions (POST /api/meeting-requests/{meeting_id}/...) ───

export interface CloseMeetingBody {
  notes?: string;
}

export interface CloseMeetingResponse {
  meeting_request_id: string;
  status: string;
  action: "close";
  closed_at: string;
  notes?: string;
}

export async function closeMeeting(
  meetingId: string,
  body: CloseMeetingBody = {}
): Promise<CloseMeetingResponse> {
  const base = getBaseUrl();
  const url = `${base}/meeting-requests/${encodeURIComponent(meetingId)}/close`;
  const res = await fetch(url, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Close meeting API error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`);
  }
  return res.json();
}

export interface DelegateMeetingBody {
  delegate_user_id: string;
  guidance_text?: string;
}

export interface DelegateMeetingResponse {
  meeting_request_id: string;
  status: string;
  action: "delegate";
}

export async function delegateMeeting(
  meetingId: string,
  body: DelegateMeetingBody
): Promise<DelegateMeetingResponse> {
  const base = getBaseUrl();
  const url = `${base}/meeting-requests/${encodeURIComponent(meetingId)}/delegate`;
  const res = await fetch(url, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delegate meeting API error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`);
  }
  return res.json();
}

export interface PassMeetingBody {
  notes?: string;
}

export interface PassMeetingResponse {
  meeting_request_id: string;
  status: string;
  action: "pass";
  closed_at: string;
  notes?: string;
}

export async function passMeeting(
  meetingId: string,
  body: PassMeetingBody = {}
): Promise<PassMeetingResponse> {
  const base = getBaseUrl();
  const url = `${base}/meeting-requests/${encodeURIComponent(meetingId)}/pass`;
  const res = await fetch(url, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pass meeting API error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`);
  }
  return res.json();
}

// ─── Cancel meeting (POST /api/meeting-requests/{meeting_id}/cancel) ───

export interface CancelMeetingBody {
  reason?: string;
  notes?: string;
}

export interface CancelMeetingResponse {
  meeting_request_id: string;
  status: string;
  action: "cancel";
}

export async function cancelMeeting(
  meetingId: string,
  body: CancelMeetingBody = {}
): Promise<CancelMeetingResponse> {
  const base = getBaseUrl();
  const url = `${base}/meeting-requests/${encodeURIComponent(meetingId)}/cancel`;
  const res = await fetch(url, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cancel meeting API error: ${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`);
  }
  return res.json();
}
