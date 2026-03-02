import type { Model, ModelCatalog, NormalizedUsage, UsageLike } from "@tokenlens/core";
/**
 * @deprecated Prefer getContextData/getTokenCosts/getUsageData
 */
export declare function modelMeta(id: string, opts?: {
    catalog?: ModelCatalog;
}): {
    id: string;
    displayName?: string;
    provider: Model["provider"];
    status: Model["status"];
    maxTokens?: number;
    pricePerTokenIn?: number;
    pricePerTokenOut?: number;
    source: string;
};
/**
 * @deprecated Prefer getContextData/getUsageData
 */
export declare function percentOfContextUsed(args: {
    id: string;
    usage: UsageLike | NormalizedUsage;
    reserveOutput?: number;
    catalog?: ModelCatalog;
}): number;
/**
 * @deprecated Prefer getContextData/getUsageData
 */
export declare function tokensRemaining(args: {
    id: string;
    usage: UsageLike | NormalizedUsage;
    reserveOutput?: number;
    catalog?: ModelCatalog;
}): number | undefined;
/**
 * @deprecated Prefer getTokenCosts/getUsageData
 */
export declare function costFromUsage(args: {
    id: string;
    usage: UsageLike | NormalizedUsage;
    catalog?: ModelCatalog;
}): number | undefined;
