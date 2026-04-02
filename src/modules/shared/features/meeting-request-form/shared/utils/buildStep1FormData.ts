type Step1Values = Record<string, unknown>;

/** Map form field names to API payload field names */
const FIELD_RENAME_MAP: Record<string, string> = {
  previous_meeting_id: "prev_ext_id",
};

export function buildStep1FormData(data: Step1Values): FormData {
  const fd = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;

    const apiKey = FIELD_RENAME_MAP[key] ?? key;

    if (value instanceof File) {
      fd.append(apiKey, value);
    } else if (key === "agenda_items" && Array.isArray(value)) {
      fd.append(apiKey, JSON.stringify(value));
    } else if (typeof value === "object" && !(value instanceof Date)) {
      const cleaned = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(([, v]) => v != null && v !== '')
      );
      fd.append(apiKey, JSON.stringify(cleaned));
    } else {
      fd.append(apiKey, String(value));
    }
  }

  return fd;
}