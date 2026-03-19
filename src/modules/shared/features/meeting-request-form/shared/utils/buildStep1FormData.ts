type Step1Values = Record<string, unknown>;

export function buildStep1FormData(data: Step1Values): FormData {
  const fd = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;

    if (value instanceof File) {
      fd.append(key, value);
    } else if (key === "agenda_items" && Array.isArray(value)) {
      fd.append(key, JSON.stringify(value));
    } else if (typeof value === "object" && !(value instanceof Date)) {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, String(value));
    }
  }

  return fd;
}