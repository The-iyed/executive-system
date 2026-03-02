import type { Model, ModelCatalog, NormalizedUsage, ProviderInfo, TokenBreakdown, UsageLike } from "@tokenlens/core";
/**
 * Return the raw context window caps for a model id (canonical or alias).
 * @deprecated Prefer getContext({ modelId, providers })
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
 * @deprecated Prefer getUsage/getTokenCosts with providers
 */
export declare function normalizeUsage(usage: UsageLike | NormalizedUsage | undefined | null): NormalizedUsage;
/**
 * @deprecated Prefer getUsage/getTokenCosts with providers
 */
export declare function breakdownTokens(usage: UsageLike | NormalizedUsage | TokenBreakdown | undefined | null): TokenBreakdown;
/** @deprecated Prefer getContext/getUsage */
export type RemainingArgs = {
    modelId: string;
    usage: UsageLike | NormalizedUsage | undefined;
    reserveOutput?: number;
    strategy?: "combined" | "provider-default" | "input-only";
    catalog?: ModelCatalog;
};
/**
 * @deprecated Prefer getContext/getUsage with providers
 */
export declare function remainingContext(args: RemainingArgs): {
    remainingInput?: number;
    remainingCombined?: number;
    percentUsed: number;
    model?: Model;
};
/**
 * @deprecated Prefer getContext/getUsage with providers
 */
export declare function fitsContext({ modelId, tokens, reserveOutput, catalog, }: {
    modelId: string;
    tokens: number;
    reserveOutput?: number;
    catalog?: ModelCatalog;
}): boolean;
/**
 * @deprecated Prefer getContext + filtering models externally
 */
export declare function pickModelFor(tokens: number, opts?: {
    provider?: Model["provider"];
    minStatus?: Model["status"];
    buffer?: number;
    catalog?: ModelCatalog;
}): Model | undefined;
/**
 * @deprecated Prefer getTokenCosts/getUsage with providers
 */
export declare function estimateCost({ modelId, usage, catalog, }: {
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
 * @deprecated Prefer getUsage/getTokenCosts
 */
export declare function consumedTokens(usage: UsageLike | NormalizedUsage | undefined | null): number;
/** @deprecated Prefer getUsage/getTokenCosts/getContext */
export type UsageSummary = {
    modelId?: string;
    context?: ReturnType<typeof getContextWindow>;
    normalized: ReturnType<typeof normalizeUsage>;
    breakdown: ReturnType<typeof breakdownTokens>;
    costUSD?: ReturnType<typeof estimateCost>;
    percentUsed?: number;
};
/**
 * Pure aggregator: summarize usage, cost, and context.
 * Requires an explicit catalog for model-specific fields.
 */
/**
 * @deprecated Prefer getUsage/getTokenCosts/getContext
 */
export declare function summarizeUsage(args: {
    modelId?: string;
    usage: UsageLike | undefined;
    catalog?: ModelCatalog;
    reserveOutput?: number;
}): UsageSummary;
export type ContextData = {
    inputMax?: number;
    outputMax?: number;
    combinedMax?: number;
    totalMax?: number;
};
export type TokenCosts = {
    inputUSD?: number;
    outputUSD?: number;
    totalUSD?: number;
    reasoningUSD?: number;
    cacheReadUSD?: number;
    cacheWriteUSD?: number;
};
export type UsageData = {
    context?: ContextData;
    costUSD?: TokenCosts;
};
export declare function getTokenCosts(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage | TokenBreakdown | undefined;
    providers: ModelCatalog | ProviderInfo;
}): TokenCosts & {
    inputTokenUSD?: number;
    outputTokenUSD?: number;
    reasoningTokenUSD?: number;
    cacheReadsUSD?: number;
    cacheWritesUSD?: number;
};
export declare function getTokenCosts(modelId: string, usage: UsageLike | NormalizedUsage | TokenBreakdown | undefined, providers: ModelCatalog | ProviderInfo): TokenCosts & {
    inputTokenUSD?: number;
    outputTokenUSD?: number;
    reasoningTokenUSD?: number;
    cacheReadsUSD?: number;
    cacheWritesUSD?: number;
};
export declare function getContext(args: {
    modelId: string;
    providers: ModelCatalog | ProviderInfo;
}): ContextData & {
    maxInput?: number;
    maxOutput?: number;
    maxTotal?: number;
};
export declare function getContext(modelId: string, providers: ModelCatalog | ProviderInfo): ContextData & {
    maxInput?: number;
    maxOutput?: number;
    maxTotal?: number;
};
export declare function getUsage(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage | TokenBreakdown | undefined;
    providers: ModelCatalog | ProviderInfo;
    reserveOutput?: number;
}): UsageData;
export declare function getUsage(modelId: string, usage: UsageLike | NormalizedUsage | TokenBreakdown | undefined, providers: ModelCatalog | ProviderInfo, reserveOutput?: number): UsageData;
/**
 * @deprecated Prefer getContext/getUsage
 */
export declare function percentRemaining(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage;
    reserveOutput?: number;
    catalog?: ModelCatalog;
}): number;
/**
 * @deprecated Prefer getContext/getUsage
 */
export declare function shouldCompact(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage;
    reserveOutput?: number;
    threshold?: number;
    catalog?: ModelCatalog;
}): boolean;
/**
 * @deprecated Prefer getContext/getUsage
 */
export declare function contextHealth(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage;
    reserveOutput?: number;
    warnAt?: number;
    compactAt?: number;
    catalog?: ModelCatalog;
}): {
    percentUsed: number;
    remaining?: number;
    status: "ok" | "warn" | "compact";
};
/**
 * @deprecated Prefer getContext/getUsage
 */
export declare function tokensToCompact(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage;
    reserveOutput?: number;
    targetPercent?: number;
    catalog?: ModelCatalog;
}): number;
