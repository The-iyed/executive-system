import type { ModelCatalog, NormalizedUsage, TokenBreakdown, UsageLike } from "@tokenlens/core";
/**
 * @deprecated This surface will likely be replaced by higher-level conversation tooling.
 */
export declare function sumUsage(usages: Array<UsageLike | NormalizedUsage | TokenBreakdown | undefined | null>): NormalizedUsage;
/**
 * @deprecated Prefer getUsage/getTokenCosts
 */
export declare function estimateConversationCost(args: {
    modelId: string;
    usages: Array<UsageLike | NormalizedUsage | TokenBreakdown | undefined | null>;
    catalog?: ModelCatalog;
}): {
    inputUSD?: number;
    outputUSD?: number;
    totalUSD?: number;
};
export type ContextRotResult = {
    totalTokens: number;
    recentTokens: number;
    staleTokens: number;
    staleShareOfUsed: number;
    staleShareOfMax?: number;
    trimFrom?: number;
};
/**
 * @deprecated This surface may move to a separate module.
 */
export declare function computeContextRot(args: {
    messageTokens: number[];
    keepRecentTurns?: number;
    modelId?: string;
    targetStaleShareOfUsed?: number;
    catalog?: ModelCatalog;
}): ContextRotResult;
/**
 * @deprecated Prefer getContext/getUsage
 */
export declare function nextTurnBudget(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage | undefined;
    reserveOutput?: number;
    catalog?: ModelCatalog;
}): number | undefined;
