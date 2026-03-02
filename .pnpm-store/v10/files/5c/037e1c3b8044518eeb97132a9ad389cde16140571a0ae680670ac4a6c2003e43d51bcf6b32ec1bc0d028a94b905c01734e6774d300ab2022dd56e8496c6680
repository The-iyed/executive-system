import { estimateConversationCost as _estimateConversationCost, nextTurnBudget as _nextTurnBudget, computeContextRot, sumUsage, } from "@tokenlens/helpers/conversation";
import { defaultCatalog } from "./source.js";
export { computeContextRot, sumUsage };
/**
 * @deprecated Prefer getUsage/getTokenCosts; conversation-level helpers may move to a separate surface.
 */
export function estimateConversationCost(args) {
    const catalog = args.catalog ?? defaultCatalog;
    return _estimateConversationCost({
        modelId: args.modelId,
        usages: args.usages,
        catalog,
    });
}
/**
 * @deprecated Prefer getContext/getUsage; next-turn budgeting may be replaced by a separate component.
 */
export function nextTurnBudget(args) {
    const catalog = args.catalog ?? defaultCatalog;
    return _nextTurnBudget({
        modelId: args.modelId,
        usage: args.usage,
        reserveOutput: args.reserveOutput,
        catalog,
    });
}
//# sourceMappingURL=conversation.js.map