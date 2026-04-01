// @ts-nocheck — Deno edge function, not compiled by Vite
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_URL = "https://api-unified-platform.momrahai.com";
const ACTIONS_BASE_URL = "https://momah-business-cards.momrahai.com/api/v1";

// Execution system auth (for actions, etc.)
let cachedToken: string | null = null;
let tokenExpiry = 0;

const MINISTER_SCHEDULE_API_KEY = "7f3Kx9QvL2mNp8Rz4TgH6yUa1BcD5eWj";

async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const email = Deno.env.get("EXECUTION_SYSTEM_EMAIL");
  const password = Deno.env.get("EXECUTION_SYSTEM_PASSWORD");
  if (!email || !password) throw new Error("EXECUTION_SYSTEM credentials not configured");

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed [${res.status}]: ${text}`);
  }
  const data = await res.json();
  cachedToken = data.access_token || data.token;
  if (!cachedToken) throw new Error("No token in auth response");
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken;
}

/** Fetch minister schedule for a single date using x-api-key */
async function fetchMinisterSchedule(date: string, view = "daily"): Promise<any> {
  const url = `${BASE_URL}/api/meetings/minister/schedule?date=${date}&view=${view}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-api-key": MINISTER_SCHEDULE_API_KEY,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Minister schedule API error [${res.status}]: ${text.slice(0, 500)}`);
  }
  return res.json();
}

/** Fetch meetings across a date range by calling the schedule API per day */
async function fetchMeetingsInRange(startDate: string, endDate: string): Promise<any[]> {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const allMeetings: any[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    try {
      const data = await fetchMinisterSchedule(dateStr, "daily");
      const meetings = data.meetings || [];
      allMeetings.push(...meetings);
    } catch (e) {
      console.error(`Failed to fetch schedule for ${dateStr}:`, e);
    }
  }
  return allMeetings;
}

function generateMockPerformanceData(period: string) {
  const periodLabel = { week: "الأسبوع", month: "الشهر", quarter: "الربع", year: "السنة" }[period] || "الشهر";
  return {
    type: "employee_performance",
    period: periodLabel,
    kpis: [
      { label: "المهام المنجزة", value: 87, target: 100, unit: "مهمة", trend: "up", change: 12 },
      { label: "نسبة الإنجاز", value: 78, target: 100, unit: "%", trend: "up", change: 5 },
      { label: "المهام المتأخرة", value: 8, target: 0, unit: "مهمة", trend: "down", change: -3 },
      { label: "متوسط وقت الإنجاز", value: 2.4, target: 3, unit: "يوم", trend: "up", change: -0.3 },
    ],
    top_performers: [
      { name: "أحمد محمد", department: "تقنية المعلومات", tasks_completed: 24, score: 95 },
      { name: "سارة العتيبي", department: "الموارد البشرية", tasks_completed: 21, score: 92 },
      { name: "خالد الشمري", department: "المالية", tasks_completed: 19, score: 88 },
    ],
  };
}

interface ToolResult {
  text: string;
  structured_data?: { tool: string; data: unknown };
}

async function callTool(name: string, args: Record<string, unknown>, token: string): Promise<ToolResult> {
  let url: string;

  switch (name) {
    case "get_meetings_by_date_range": {
      try {
        const startStr = args.start_date as string;
        const endStr = args.end_date as string;
        const meetings = await fetchMeetingsInRange(startStr, endStr);
        return { text: JSON.stringify(meetings), structured_data: { tool: name, data: meetings } };
      } catch (err) {
        return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
      }
    }
    case "search_similar_meetings":
    case "search_meetings": {
      try {
        // Search across a wide range (last 30 days + next 30 days)
        const now = new Date();
        const past = new Date(now); past.setDate(past.getDate() - 30);
        const future = new Date(now); future.setDate(future.getDate() + 30);
        const allMeetings = await fetchMeetingsInRange(
          past.toISOString().slice(0, 10),
          future.toISOString().slice(0, 10)
        );
        const query = (args.question as string || "").toLowerCase();
        const filtered = allMeetings.filter((m: any) => {
          const title = (m.title || "").toLowerCase();
          const location = (m.location || "").toLowerCase();
          const type = (m.type || m.meeting_classification_type || "").toLowerCase();
          return title.includes(query) || location.includes(query) || type.includes(query);
        }).slice(0, 20);
        const results = filtered.length > 0 ? filtered : allMeetings.slice(0, 10);
        return { text: JSON.stringify(results), structured_data: { tool: name, data: results } };
      } catch (err) {
        return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
      }
    }
    case "get_meeting_details": {
      try {
        const meetingId = args.meeting_id as string;
        // Try dedicated endpoint with x-api-key
        const detailUrl = `${BASE_URL}/api/meetings/${meetingId}`;
        let res = await fetch(detailUrl, {
          headers: {
            accept: "application/json",
            "x-api-key": MINISTER_SCHEDULE_API_KEY,
          },
        });

        if (res.ok) {
          const data = await res.json();
          return { text: JSON.stringify(data), structured_data: { tool: name, data } };
        }

        // Fallback: search in today's and nearby schedules to find the meeting by ID
        console.log(`Direct meeting fetch failed [${res.status}], falling back to schedule search`);
        const now = new Date();
        const past = new Date(now); past.setDate(past.getDate() - 7);
        const future = new Date(now); future.setDate(future.getDate() + 7);
        const allMeetings = await fetchMeetingsInRange(
          past.toISOString().slice(0, 10),
          future.toISOString().slice(0, 10)
        );
        const found = allMeetings.find((m: any) => m.id === meetingId);
        if (found) {
          return { text: JSON.stringify(found), structured_data: { tool: name, data: found } };
        }
        return { text: JSON.stringify({ error: `Meeting not found with ID: ${meetingId}` }) };
      } catch (err) {
        return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
      }
    }
    case "get_waiting_list": {
      const wlUrl = `${BASE_URL}/api/scheduling/waiting-list?skip=${args.skip ?? 0}&limit=${args.limit ?? 10}`;
      try {
        const res = await fetch(wlUrl, {
          headers: {
            accept: "application/json",
            "x-api-key": MINISTER_SCHEDULE_API_KEY,
          },
        });
        if (!res.ok) {
          const text = await res.text();
          return { text: JSON.stringify({ error: `Waiting list fetch failed [${res.status}]`, details: text.slice(0, 500) }) };
        }
        const data = await res.json();
        return { text: JSON.stringify(data), structured_data: { tool: name, data } };
      } catch (err) {
        return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
      }
    }
    case "get_employee_performance": {
      const data = generateMockPerformanceData((args.period as string) || "month");
      return { text: JSON.stringify(data), structured_data: { tool: name, data } };
    }
    case "get_pending_actions":
      url = `${ACTIONS_BASE_URL}/actions/pending?skip=${args.skip ?? 0}&limit=${args.limit ?? 100}`;
      break;
    case "get_actions_stats":
      url = `${ACTIONS_BASE_URL}/actions/stats?top_n=${args.top_n ?? 50}`;
      break;
    case "get_action_meeting": {
      const meetingUrl = `${ACTIONS_BASE_URL}/actions/${args.action_id}/meeting`;
      try {
        const meetingRes = await fetch(meetingUrl, {
          headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
        });
        if (!meetingRes.ok) {
          const text = await meetingRes.text();
          return { text: JSON.stringify({ error: `Meeting fetch failed [${meetingRes.status}]`, details: text.slice(0, 500) }) };
        }
        const meetingData = await meetingRes.json();
        const str = JSON.stringify(meetingData);
        const truncated = str.length > 10000 ? str.slice(0, 10000) + "...(truncated)" : str;
        return { text: truncated, structured_data: { tool: name, data: meetingData } };
      } catch (err) {
        return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
      }
    }
    case "create_action": {
      const actionUrl = `${ACTIONS_BASE_URL}/actions/`;
      const body = {
        title: args.title as string,
        due_date: (args.due_date as string) || new Date().toISOString(),
        status: (args.status as string) || "PENDING",
        is_completed: false,
        meeting_id: 1,
        assignees: (args.assignees as string[]) || [],
      };
      try {
        const res = await fetch(actionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          return { text: JSON.stringify({ error: `Create action failed [${res.status}]`, details: text.slice(0, 500) }) };
        }
        const data = await res.json();
        return { text: JSON.stringify(data), structured_data: { tool: name, data } };
      } catch (err) {
        return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
      }
    }
    case "get_actions_by_name": {
      const nameParam = encodeURIComponent(args.name as string);
      const actionsUrl = `${ACTIONS_BASE_URL}/actions/by-name?name=${nameParam}&skip=${args.skip ?? 0}&limit=${args.limit ?? 100}`;
      try {
        const res = await fetch(actionsUrl, { headers: { accept: "application/json" } });
        if (!res.ok) {
          const text = await res.text();
          return { text: JSON.stringify({ error: `Get actions by name failed [${res.status}]`, details: text.slice(0, 500) }) };
        }
        const data = await res.json();
        const str = JSON.stringify(data);
        return { text: str.length > 8000 ? str.slice(0, 8000) + "...(truncated)" : str, structured_data: { tool: name, data } };
      } catch (err) {
        return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
      }
    }
    case "create_directive": {
      const directiveUrl = `${BASE_URL}/api/minister-directives`;
      const body = {
        title: args.title as string,
        status: "TAKEN",
        scheduling_officer_status: "OPEN",
      };
      try {
        const res = await fetch(directiveUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            "x-api-key": MINISTER_SCHEDULE_API_KEY,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          return { text: JSON.stringify({ error: `Create directive failed [${res.status}]`, details: text.slice(0, 500) }) };
        }
        const data = await res.json();
        return { text: JSON.stringify(data), structured_data: { tool: name, data } };
      } catch (err) {
        return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
      }
    }
    case "web_search": {
      const searchUrl = "https://aoun-api.momrahai.com/api/v1/web-search/query";
      try {
        const res = await fetch(searchUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", accept: "application/json" },
          body: JSON.stringify({ query: args.query as string, top_k: (args.top_k as number) || 10 }),
        });
        if (!res.ok) {
          const text = await res.text();
          return { text: JSON.stringify({ error: `Web search failed [${res.status}]`, details: text.slice(0, 500) }) };
        }
        const data = await res.json();
        const result = { type: "web_search_results", query: args.query, results: Array.isArray(data) ? data : data?.results || data?.items || [data] };
        return { text: JSON.stringify(result), structured_data: { tool: name, data: result } };
      } catch (err) {
        return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
      }
    }
    case "summarize_meetings": {
      try {
        const startStr = args.start_date as string;
        const endStr = args.end_date as string;
        const start = new Date(startStr + "T00:00:00");
        const end = new Date(endStr + "T00:00:00");

        // Collect full API responses per day (with summary, grouped_by_*, etc.)
        const allMeetings: any[] = [];
        const allSummaries: any[] = [];
        const mergedGroupedByType: Record<string, any[]> = {};
        const mergedGroupedByClassificationType: Record<string, any[]> = {};
        const mergedGroupedByClassification: Record<string, any[]> = {};
        const mergedDistributionBySector: Record<string, number> = {};
        const sectorMeta: Record<string, { label?: string; color?: string }> = {};

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().slice(0, 10);
          try {
            const data = await fetchMinisterSchedule(dateStr, "daily");
            const meetings = data.meetings || [];
            allMeetings.push(...meetings);
            if (data.summary) allSummaries.push(data.summary);

            // Merge grouped_by_type
            if (data.grouped_by_type) {
              for (const [key, arr] of Object.entries(data.grouped_by_type)) {
                if (!mergedGroupedByType[key]) mergedGroupedByType[key] = [];
                mergedGroupedByType[key].push(...(arr as any[]));
              }
            }
            // Merge grouped_by_classification_type
            if (data.grouped_by_classification_type) {
              for (const [key, arr] of Object.entries(data.grouped_by_classification_type)) {
                if (!mergedGroupedByClassificationType[key]) mergedGroupedByClassificationType[key] = [];
                mergedGroupedByClassificationType[key].push(...(arr as any[]));
              }
            }
            // Merge grouped_by_classification
            if (data.grouped_by_classification) {
              for (const [key, arr] of Object.entries(data.grouped_by_classification)) {
                if (!mergedGroupedByClassification[key]) mergedGroupedByClassification[key] = [];
                mergedGroupedByClassification[key].push(...(arr as any[]));
              }
            }
            // Merge distribution_by_sector
            if (data.summary?.distribution_by_sector) {
              for (const item of data.summary.distribution_by_sector) {
                const key = item.sector || item.label || "OTHER";
                mergedDistributionBySector[key] = (mergedDistributionBySector[key] || 0) + (item.value ?? item.count ?? 0);
                if (!sectorMeta[key]) sectorMeta[key] = { label: item.label, color: item.color };
              }
            }
          } catch (e) {
            console.error(`Failed to fetch schedule for ${dateStr}:`, e);
          }
        }

        const totalMeetings = allMeetings.length;
        const totalAttendees = allMeetings.reduce((sum: number, m: any) => sum + (m.invitees_count || m.invitees?.length || m.attendees_count || m.attendees?.length || 0), 0);
        const totalInvitees = allMeetings.reduce((sum: number, m: any) => sum + (m.invitees?.length || 0) + (m.minister_attendees?.length || 0), 0);
        const effectiveInvitees = totalInvitees > totalAttendees ? totalInvitees : totalAttendees;

        // Compute avg presentation duration
        const durations = allMeetings.map((m: any) => m.presentation_duration).filter((d: any) => typeof d === 'number' && d > 0);
        const avgPresentationDuration = durations.length > 0 ? Math.round(durations.reduce((s: number, d: number) => s + d, 0) / durations.length) : 0;
        const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
        const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
        const totalDuration = durations.reduce((s: number, d: number) => s + d, 0);

        // Count unique days with meetings
        const uniqueDays = new Set(allMeetings.map((m: any) => {
          const d = m.meeting_start_time || m.scheduled_start || m.date || "";
          return d ? d.slice(0, 10) : "";
        }).filter(Boolean));
        const daysWithMeetings = uniqueDays.size;
        const avgMeetingsPerDay = daysWithMeetings > 0 ? Math.round((totalMeetings / daysWithMeetings) * 10) / 10 : 0;

        // Count urgent & protocol meetings
        const urgentCount = allMeetings.filter((m: any) => m.is_urgent).length;
        const protocolCount = allMeetings.filter((m: any) => m.requires_protocol).length;
        const hasContentCount = allMeetings.filter((m: any) => m.has_content).length;
        const dataCompleteCount = allMeetings.filter((m: any) => m.is_data_complete).length;

        // Max invitees in a single meeting
        const maxInvitees = allMeetings.reduce((mx: number, m: any) => {
          const c = (m.invitees?.length || 0) + (m.minister_attendees?.length || 0);
          return c > mx ? c : mx;
        }, 0);

        // By day of week
        const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        const byDayOfWeek: Record<string, number> = {};
        for (const m of allMeetings) {
          const raw = m.meeting_start_time || m.scheduled_start || m.date || "";
          if (raw) {
            try {
              const dow = new Date(raw).getDay();
              const name = dayNames[dow] || String(dow);
              byDayOfWeek[name] = (byDayOfWeek[name] || 0) + 1;
            } catch {}
          }
        }
        const byDayArr = Object.entries(byDayOfWeek).map(([name, count]) => ({ name, count }));

        // By hour
        const byHour: Record<string, number> = {};
        for (const m of allMeetings) {
          const raw = m.meeting_start_time || m.scheduled_start || "";
          if (raw) {
            try {
              const h = new Date(raw).getHours();
              const label = `${h.toString().padStart(2, "0")}:00`;
              byHour[label] = (byHour[label] || 0) + 1;
            } catch {}
          }
        }
        const byHourArr = Object.entries(byHour).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));

        // Count by field helper
        const countBy = (field: string) => {
          const counts: Record<string, number> = {};
          for (const m of allMeetings) {
            const val = (m as any)[field] || "غير محدد";
            counts[val] = (counts[val] || 0) + 1;
          }
          return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        };

        const byChannel = countBy("meeting_channel");
        const byConfidentiality = countBy("meeting_confidentiality");
        const byOwner = countBy("meeting_owner_name");

        const distribution_by_sector = Object.entries(mergedDistributionBySector).map(([key, value]) => ({
          sector: key,
          label: sectorMeta[key]?.label || key,
          color: sectorMeta[key]?.color,
          value,
        }));

        const summary = {
          type: "meetings_summary",
          period: `${startStr} — ${endStr}`,
          total_meetings: totalMeetings,
          total_attendees: totalAttendees,
          total_invitees: effectiveInvitees,
          avg_attendees: totalMeetings > 0 ? Math.round(effectiveInvitees / totalMeetings) : 0,
          avg_presentation_duration: avgPresentationDuration,
          max_presentation_duration: maxDuration,
          min_presentation_duration: minDuration,
          total_duration: totalDuration,
          days_with_meetings: daysWithMeetings,
          avg_meetings_per_day: avgMeetingsPerDay,
          max_invitees: maxInvitees,
          urgent_count: urgentCount,
          protocol_count: protocolCount,
          has_content_count: hasContentCount,
          data_complete_count: dataCompleteCount,
          by_channel: byChannel,
          by_confidentiality: byConfidentiality,
          by_owner: byOwner,
          by_day_of_week: byDayArr,
          by_hour: byHourArr,
          summary: {
            total_meetings: totalMeetings,
            distribution_by_sector,
          },
          grouped_by_type: mergedGroupedByType,
          grouped_by_classification_type: mergedGroupedByClassificationType,
          grouped_by_classification: mergedGroupedByClassification,
        };
        // Label maps for Arabic voice output
        const typeLabels: Record<string, string> = {
          COUNCILS_AND_COMMITTEES: "المجالس واللجان", EVENTS_AND_VISITS: "الفعاليات والزيارات",
          STRATEGIC: "استراتيجي", OPERATIONAL: "تشغيلي", SPECIAL: "خاص",
          INTERNAL: "داخلي", EXTERNAL: "خارجي", CONFIDENTIAL: "سري", PUBLIC: "عام",
          PHYSICAL: "حضوري", VIRTUAL: "عن بُعد", HYBRID: "هجين",
          BILATERAL_MEETING: "لقاء ثنائي", BUSINESS: "أعمال",
          DISCUSSION_WITHOUT_PRESENTATION: "مناقشة بدون عرض تقديمي",
        };
        const lb = (k: string) => typeLabels[k] || k;

        // Match chart titles exactly:
        // حسب النوع = grouped_by_type (INTERNAL, EXTERNAL, BUSINESS)
        // حسب الفئة = grouped_by_classification_type (STRATEGIC, OPERATIONAL, SPECIAL)
        // حسب التصنيف = grouped_by_classification (COUNCILS_AND_COMMITTEES, BILATERAL_MEETING, etc.)
        const byTypeText = Object.entries(mergedGroupedByType).map(([k, v]) => `${lb(k)}: ${(v as any[]).length}`).join("، ");
        const byCategoryText = Object.entries(mergedGroupedByClassificationType).map(([k, v]) => `${lb(k)}: ${(v as any[]).length}`).join("، ");
        const byClassificationText = Object.entries(mergedGroupedByClassification).map(([k, v]) => `${lb(k)}: ${(v as any[]).length}`).join("، ");
        const bySectorText = distribution_by_sector.map(s => `${s.label}: ${s.value}`).join("، ");

        const voiceText = `إجمالي الاجتماعات: ${totalMeetings} اجتماع. إجمالي الحضور: ${totalAttendees}. متوسط الحضور لكل اجتماع: ${totalMeetings > 0 ? Math.round(totalAttendees / totalMeetings) : 0}. حسب النوع: ${byTypeText}. حسب الفئة: ${byCategoryText}. حسب التصنيف: ${byClassificationText}. حسب القطاع: ${bySectorText}.`;
        return { text: voiceText, structured_data: { tool: name, data: summary } };
      } catch (err) {
        return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
      }
    }
    default:
      return { text: JSON.stringify({ error: `Unknown tool: ${name}` }) };
  }

  // Default fetch for tools that set `url`
  try {
    const res = await fetch(url!, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    });
    if (!res.ok) {
      const text = await res.text();
      return { text: JSON.stringify({ error: `API call failed [${res.status}]`, details: text.slice(0, 500) }) };
    }
    const data = await res.json();
    const str = JSON.stringify(data);
    const truncated = str.length > 10000 ? str.slice(0, 10000) + "...(truncated)" : str;
    return { text: truncated, structured_data: { tool: name, data } };
  } catch (err) {
    return { text: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool_name, arguments: args } = await req.json();
    if (!tool_name) {
      return new Response(JSON.stringify({ error: "tool_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth token is only needed for actions API; don't fail if unavailable
    let token = "";
    try {
      token = await getAuthToken();
    } catch (authErr) {
      console.warn("Auth token unavailable (may not be needed):", authErr);
    }
    const { text, structured_data } = await callTool(tool_name, args || {}, token);

    return new Response(JSON.stringify({ result: text, structured_data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
