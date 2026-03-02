/**
 * Context and cost helpers (back-compat wrappers).
 *
 * For new code, pass a catalog explicitly:
 * - Fetch a live catalog via `fetchModels()` from `@tokenlens/fetch` and pass `{ catalog }`.
 * - Or build a static catalog via `getModels()` from `@tokenlens/models` and pass `{ catalog }`.
 *
 * These wrappers fall back to a bundled default catalog for backwards compatibility.
 */
import type { ModelCatalog, NormalizedUsage, TokenBreakdown, UsageLike, ProviderInfo } from "@tokenlens/core";
import { breakdownTokens as _breakdownTokens, consumedTokens as _consumedTokens, normalizeUsage as _normalizeUsage, pickModelFor as _pickModelFor } from "@tokenlens/helpers/context";
export type { ContextData, TokenCosts, UsageData, UsageSummary, } from "@tokenlens/helpers/context";
/**
 * @deprecated Prefer getContext/getUsage/getTokenCosts with `{ providers }`. For raw caps use helpers directly.
 */
export declare function getContextWindow(modelId: string, opts?: {
    catalog?: ModelCatalog;
}): {
    inputMax?: number;
    outputMax?: number;
    combinedMax?: number;
    totalMax?: number;
};
/**
 * @deprecated Prefer getContext/getUsage with `{ providers }`.
 */
export declare function remainingContext(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage | undefined;
    reserveOutput?: number;
    strategy?: "combined" | "provider-default" | "input-only";
    catalog?: ModelCatalog;
}): {
    remainingInput?: number;
    remainingCombined?: number;
    percentUsed: number;
    model?: import("@tokenlens/core").Model;
};
/**
 * @deprecated Prefer getTokenCosts/getUsage with `{ providers }`.
 */
export declare function estimateCost(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage | TokenBreakdown;
    catalog?: ModelCatalog;
}): {
    inputUSD?: number;
    outputUSD?: number;
    totalUSD?: number;
    reasoningUSD?: number;
    cacheReadUSD?: number;
    cacheWriteUSD?: number;
};
/**
 * @deprecated Prefer getContext/getUsage with `{ providers }`.
 */
export declare function fitsContext(args: {
    modelId: string;
    tokens: number;
    reserveOutput?: number;
    catalog?: ModelCatalog;
}): boolean;
/**
 * @deprecated Pass `{ catalog }` from `@tokenlens/fetch` (`fetchModels()`) or from `@tokenlens/models` (`getModels()`).
 */
export declare function percentRemaining(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage;
    reserveOutput?: number;
    catalog?: ModelCatalog;
}): number;
/**
 * @deprecated Pass `{ catalog }` from `@tokenlens/fetch` (`fetchModels()`) or from `@tokenlens/models` (`getModels()`).
 */
export declare function shouldCompact(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage;
    reserveOutput?: number;
    threshold?: number;
    catalog?: ModelCatalog;
}): boolean;
/**
 * @deprecated Pass `{ catalog }` from `@tokenlens/fetch` (`fetchModels()`) or from `@tokenlens/models` (`getModels()`).
 */
export declare function tokensToCompact(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage;
    reserveOutput?: number;
    targetPercent?: number;
    catalog?: ModelCatalog;
}): number;
/**
 * @deprecated Pass `{ catalog }` from `@tokenlens/fetch` (`fetchModels()`) or from `@tokenlens/models` (`getModels()`).
 */
export declare function contextHealth(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage;
    reserveOutput?: number;
    catalog?: ModelCatalog;
}): {
    percentUsed: number;
    remaining?: number;
    status: "ok" | "warn" | "compact";
};
/** @deprecated Prefer getUsage/getTokenCosts */
export declare const normalizeUsage: typeof _normalizeUsage;
/** @deprecated Prefer getUsage/getTokenCosts */
export declare const breakdownTokens: typeof _breakdownTokens;
/** @deprecated Prefer getUsage/getTokenCosts */
export declare const consumedTokens: typeof _consumedTokens;
/** @deprecated Prefer getContext + filtering externally */
export declare const pickModelFor: typeof _pickModelFor;
/** @deprecated Prefer getUsage/getTokenCosts/getContext */
export declare function summarizeUsage(args: {
    modelId?: string;
    usage: UsageLike | undefined;
    catalog?: ModelCatalog;
    reserveOutput?: number;
}): import("@tokenlens/helpers/context").UsageSummary;
/** @deprecated Internal normalization is automatic; avoid direct use. */
export declare function getTokenCosts(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage | TokenBreakdown | undefined;
    providers?: ModelCatalog | ProviderInfo;
}): import("@tokenlens/helpers/context").TokenCosts & {
    inputTokenUSD?: number;
    outputTokenUSD?: number;
    reasoningTokenUSD?: number;
    cacheReadsUSD?: number;
    cacheWritesUSD?: number;
};
export declare function getContext(args: {
    modelId: string;
    providers?: ModelCatalog | ProviderInfo;
}): import("@tokenlens/helpers/context").ContextData & {
    maxInput?: number;
    maxOutput?: number;
    maxTotal?: number;
};
export declare function getUsage(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage | TokenBreakdown | undefined;
    providers?: ModelCatalog | ProviderInfo;
    reserveOutput?: number;
}): import("@tokenlens/helpers/context").UsageData;
//# sourceMappingURL=context.d.ts.map