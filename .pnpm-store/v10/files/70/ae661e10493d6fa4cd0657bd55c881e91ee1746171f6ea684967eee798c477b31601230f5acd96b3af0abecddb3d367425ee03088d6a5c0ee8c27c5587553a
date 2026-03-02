/**
 * Thin async client for the models.dev API (https://models.dev/api.json).
 *
 * - Defaults to returning the full JSON catalog.
 * - Optionally filter by `provider` (e.g. "deepseek", "vercel") and/or `model` (e.g. "gpt-4o").
 * - No runtime dependencies. Uses `globalThis.fetch` if available, or accept a custom `fetch` via options.
 *
 * Note: This returns the raw models.dev schema as-is. Any higher-level formatting can be layered on later.
 */
export { getModelMeta } from "@tokenlens/core";
/** Coded error for better ergonomics in consumers */
export class FetchModelsError extends Error {
    code;
    status;
    constructor(opts) {
        super(opts.message);
        this.name = "FetchModelsError";
        this.code = opts.code;
        this.status = opts.status;
    }
}
/**
 * Fetches the models.dev catalog and optionally filters results by provider and/or model.
 *
 * Error handling:
 * - Throws FetchModelsError with code: 'UNAVAILABLE' (no fetch present), 'NETWORK', 'HTTP', or 'PARSE'.
 */
export async function fetchModels(opts = {}) {
    if (typeof opts === "string") {
        return fetchModels({ provider: opts });
    }
    const url = opts.baseUrl ?? "https://models.dev/api.json";
    const fetchImpl = opts.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
        throw new FetchModelsError({
            code: "UNAVAILABLE",
            message: "No fetch implementation found. Pass a custom `fetch` in options or run on a platform with global fetch (Node 18+, modern browsers).",
        });
    }
    let res;
    try {
        res = await fetchImpl(url, opts.signal ? { signal: opts.signal } : undefined);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown network error";
        throw new FetchModelsError({ code: "NETWORK", message });
    }
    if (!res.ok) {
        let body = "";
        try {
            body = await res.text();
        }
        catch { }
        const snippet = body
            ? ` Body: ${body.slice(0, 256)}${body.length > 256 ? "…" : ""}`
            : "";
        throw new FetchModelsError({
            code: "HTTP",
            status: res.status,
            message: `Failed to fetch models.dev API (${res.status} ${res.statusText}).${snippet}`,
        });
    }
    let data;
    try {
        data = await res.json();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Invalid JSON";
        throw new FetchModelsError({ code: "PARSE", message });
    }
    const catalog = data;
    const { provider, model } = opts;
    if (!provider && !model)
        return catalog;
    if (provider && !model)
        return catalog[provider];
    if (provider && model)
        return catalog[provider]?.models?.[model];
    // model only: search across providers
    const matches = [];
    if (!model)
        return matches;
    for (const [provKey, prov] of Object.entries(catalog)) {
        const m = prov?.models?.[model];
        if (m)
            matches.push({ provider: provKey, model: m });
    }
    return matches;
}
//# sourceMappingURL=index.js.map