import { costFromUsage as _costFromUsage, modelMeta as _modelMeta, percentOfContextUsed as _percentOfContextUsed, tokensRemaining as _tokensRemaining, } from "@tokenlens/helpers/simple";
import { defaultCatalog } from "./source.js";
/**
 * @deprecated Prefer getContextData/getTokenCosts/getUsageData with a catalog
 */
export function modelMeta(id, opts) {
    const catalog = opts?.catalog ?? defaultCatalog;
    return _modelMeta(id, { catalog });
}
/**
 * @deprecated Prefer getContextData/getUsageData
 */
export function percentOfContextUsed(args) {
    const catalog = args.catalog ?? defaultCatalog;
    return _percentOfContextUsed({
        id: args.id,
        usage: args.usage,
        reserveOutput: args.reserveOutput,
        catalog,
    });
}
/**
 * @deprecated Prefer getContextData/getUsageData
 */
export function tokensRemaining(args) {
    const catalog = args.catalog ?? defaultCatalog;
    return _tokensRemaining({
        id: args.id,
        usage: args.usage,
        reserveOutput: args.reserveOutput,
        catalog,
    });
}
/**
 * @deprecated Prefer getTokenCosts/getUsageData
 */
export function costFromUsage(args) {
    const catalog = args.catalog ?? defaultCatalog;
    return _costFromUsage({ id: args.id, usage: args.usage, catalog });
}
//# sourceMappingURL=simple.js.map