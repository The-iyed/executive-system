/**
 * Thin async client for the models.dev API (https://models.dev/api.json).
 *
 * - Defaults to returning the full JSON catalog.
 * - Optionally filter by `provider` (e.g. "deepseek", "vercel") and/or `model` (e.g. "gpt-4o").
 * - No runtime dependencies. Uses `globalThis.fetch` if available, or accept a custom `fetch` via options.
 *
 * Note: This returns the raw models.dev schema as-is. Any higher-level formatting can be layered on later.
 */
export type FetchLike = (input: string, init?: {
    signal?: unknown;
} & Record<string, unknown>) => Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    json(): Promise<unknown>;
    text(): Promise<string>;
}>;
import type { ModelCatalog, ProviderInfo, ProviderModel } from "@tokenlens/core";
export { getModelMeta } from "@tokenlens/core";
export type FetchModelsOptions = {
    /** Filter by provider key (e.g. "deepseek", "xai", "vercel"). */
    provider?: string;
    /** Filter by model id within a provider (or search across providers when provider is omitted). */
    model?: string;
    /** Inject a custom fetch implementation (e.g. from undici/cross-fetch). */
    fetch?: FetchLike;
    /** Optional AbortSignal or similar. */
    signal?: unknown;
    /** Override base URL for testing. Defaults to https://models.dev/api.json */
    baseUrl?: string;
};
/** Coded error for better ergonomics in consumers */
export declare class FetchModelsError extends Error {
    readonly code: "NETWORK" | "HTTP" | "PARSE" | "UNAVAILABLE";
    readonly status?: number;
    constructor(opts: {
        code: FetchModelsError["code"];
        message: string;
        status?: number;
    });
}
export declare function fetchModels(): Promise<ModelCatalog>;
export declare function fetchModels(provider: string): Promise<ProviderInfo | undefined>;
export declare function fetchModels(opts: {
    provider?: undefined;
    model?: undefined;
    fetch?: FetchLike;
    signal?: unknown;
    baseUrl?: string;
}): Promise<ModelCatalog>;
export declare function fetchModels(opts: {
    provider: string;
    model?: undefined;
    fetch?: FetchLike;
    signal?: unknown;
    baseUrl?: string;
}): Promise<ProviderInfo | undefined>;
export declare function fetchModels(opts: {
    provider?: undefined;
    model: string;
    fetch?: FetchLike;
    signal?: unknown;
    baseUrl?: string;
}): Promise<Array<{
    provider: string;
    model: ProviderModel;
}>>;
export declare function fetchModels(opts: {
    provider: string;
    model: string;
    fetch?: FetchLike;
    signal?: unknown;
    baseUrl?: string;
}): Promise<ProviderModel | undefined>;
//# sourceMappingURL=index.d.ts.map