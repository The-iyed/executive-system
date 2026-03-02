import type { ModelCatalog, NormalizedUsage, TokenBreakdown, UsageLike } from "@tokenlens/core";
import { computeContextRot, sumUsage } from "@tokenlens/helpers/conversation";
export { computeContextRot, sumUsage };
/**
 * @deprecated Prefer getUsage/getTokenCosts; conversation-level helpers may move to a separate surface.
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
/**
 * @deprecated Prefer getContext/getUsage; next-turn budgeting may be replaced by a separate component.
 */
export declare function nextTurnBudget(args: {
    modelId: string;
    usage: UsageLike | NormalizedUsage | undefined;
    reserveOutput?: number;
    catalog?: ModelCatalog;
}): number | undefined;
//# sourceMappingURL=conversation.d.ts.map