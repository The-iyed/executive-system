import { estimateCost, getContextWindow, normalizeUsage, remainingContext, } from "./context.js";
/**
 * @deprecated This surface will likely be replaced by higher-level conversation tooling.
 */
export function sumUsage(usages) {
    let input = 0;
    let output = 0;
    let total = 0;
    for (const u of usages) {
        if (!u)
            continue;
        const n = typeof u === "object" &&
            u !== null &&
            "input" in u
            ? u
            : normalizeUsage(u);
        input += n.input || 0;
        output += n.output || 0;
        if (typeof n.total === "number")
            total = (total ?? 0) + n.total;
    }
    return { input, output, total: total ?? input + output };
}
/**
 * @deprecated Prefer getUsage/getTokenCosts
 */
export function estimateConversationCost(args) {
    const u = sumUsage(args.usages);
    return estimateCost({
        modelId: args.modelId,
        usage: u,
        catalog: args.catalog,
    });
}
/**
 * @deprecated This surface may move to a separate module.
 */
export function computeContextRot(args) {
    const keepRecentTurns = Math.max(0, args.keepRecentTurns ?? 3);
    const tokens = (args.messageTokens ?? []).map((n) => Math.max(0, Math.floor(n)));
    const totalTokens = tokens.reduce((a, b) => a + b, 0);
    const recentTokens = tokens
        .slice(-keepRecentTurns)
        .reduce((a, b) => a + b, 0);
    const staleTokens = Math.max(0, totalTokens - recentTokens);
    const staleShareOfUsed = totalTokens > 0 ? staleTokens / totalTokens : 0;
    let staleShareOfMax;
    if (args.modelId) {
        const cw = getContextWindow(args.modelId, { catalog: args.catalog });
        const cap = cw.combinedMax ?? cw.inputMax;
        if (typeof cap === "number" && cap > 0)
            staleShareOfMax = staleTokens / cap;
    }
    let trimFrom;
    const target = args.targetStaleShareOfUsed;
    if (typeof target === "number" && target >= 0 && target <= 1) {
        const maxDrop = Math.max(0, tokens.length - keepRecentTurns);
        let dropped = 0;
        for (let k = 0; k <= maxDrop; k++) {
            const usedAfterDrop = totalTokens - dropped;
            const staleAfterDrop = Math.max(0, staleTokens - dropped);
            const share = usedAfterDrop > 0 ? staleAfterDrop / usedAfterDrop : 0;
            if (share <= target) {
                trimFrom = k;
                break;
            }
            if (k < maxDrop)
                dropped += tokens[k] || 0;
        }
        if (trimFrom === undefined)
            trimFrom = maxDrop;
    }
    return {
        totalTokens,
        recentTokens,
        staleTokens,
        staleShareOfUsed,
        staleShareOfMax,
        trimFrom,
    };
}
/**
 * @deprecated Prefer getContext/getUsage
 */
export function nextTurnBudget(args) {
    const rc = remainingContext({
        modelId: args.modelId,
        usage: args.usage,
        reserveOutput: args.reserveOutput,
        catalog: args.catalog,
    });
    return rc.remainingCombined ?? rc.remainingInput;
}
