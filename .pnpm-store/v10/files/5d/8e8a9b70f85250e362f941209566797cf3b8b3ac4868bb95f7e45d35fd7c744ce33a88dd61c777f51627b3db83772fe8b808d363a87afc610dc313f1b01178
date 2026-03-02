import { toModelId } from "@tokenlens/core/id";
/**
 * Return the raw context window caps for a model id (canonical or alias).
 * @deprecated Prefer getContext({ modelId, providers })
 */
export function getContextWindow(modelId, opts) {
    const m = resolveModelFromCatalog(modelId, opts?.catalog);
    const ctx = (m?.context ?? {});
    return ctx?.combinedMax !== undefined
        ? { ...ctx, totalMax: ctx.combinedMax }
        : ctx;
}
const TOKENS_PER_MILLION = 1_000_000;
/**
 * @deprecated Prefer getUsage/getTokenCosts with providers
 */
export function normalizeUsage(usage) {
    if (!usage)
        return { input: 0, output: 0, total: 0 };
    if (typeof usage.input === "number" &&
        typeof usage.output === "number") {
        const u = usage;
        return {
            input: u.input,
            output: u.output,
            total: u.total ?? u.input + u.output,
        };
    }
    const ul = usage;
    const inputCandidates = [
        ul.input_tokens,
        ul.prompt_tokens,
        ul.promptTokens,
        ul.inputTokens,
    ].filter((v) => typeof v === "number");
    const outputCandidates = [
        ul.output_tokens,
        ul.completion_tokens,
        ul.completionTokens,
        ul.outputTokens,
    ].filter((v) => typeof v === "number");
    const totalCandidates = [
        ul.total_tokens,
        ul.totalTokens,
        ul.totalTokens,
    ].filter((v) => typeof v === "number");
    const input = inputCandidates[0] ?? 0;
    const output = outputCandidates[0] ?? 0;
    const total = totalCandidates[0];
    if (total !== undefined)
        return { input, output, total };
    return { input, output, total: input + output };
}
/**
 * @deprecated Prefer getUsage/getTokenCosts with providers
 */
export function breakdownTokens(usage) {
    if (!usage)
        return {
            input: 0,
            output: 0,
            total: 0,
            cacheReads: 0,
            cacheWrites: 0,
            reasoningTokens: 0,
        };
    if (typeof usage.input === "number" &&
        typeof usage.output === "number" &&
        ("cacheReads" in usage ||
            "cacheWrites" in usage ||
            "total" in usage)) {
        const u0 = usage;
        return {
            input: u0.input,
            output: u0.output,
            total: u0.total ?? u0.input + u0.output,
            cacheReads: u0.cacheReads,
            cacheWrites: u0.cacheWrites,
            reasoningTokens: u0.reasoningTokens,
        };
    }
    const base = normalizeUsage(usage);
    const u = usage;
    const cacheReadCandidates = [
        u.cache_read_input_tokens,
        u.cache_read_tokens,
        u.prompt_cache_hit_tokens,
        u.prompt_tokens_details?.cached_tokens,
        u.promptTokensDetails?.cachedTokens,
        u.cachedInputTokens,
        u.cacheReads,
    ].filter((v) => typeof v === "number");
    const cacheWriteCandidates = [
        u.cache_creation_input_tokens,
        u.cache_creation_tokens,
        u.prompt_cache_write_tokens,
        u.promptTokensDetails?.cacheCreationTokens,
        u.cacheWrites,
    ].filter((v) => typeof v === "number");
    const cacheReads = cacheReadCandidates[0];
    const cacheWrites = cacheWriteCandidates[0];
    const reasoningCandidates = [u.reasoning_tokens, u.reasoningTokens].filter((v) => typeof v === "number");
    const reasoningTokens = reasoningCandidates[0];
    return { ...base, cacheReads, cacheWrites, reasoningTokens };
}
/**
 * @deprecated Prefer getContext/getUsage with providers
 */
export function remainingContext(args) {
    const model = resolveModelFromCatalog(args.modelId, args.catalog);
    const usage = normalizeUsage(args.usage);
    const reserve = Math.max(0, args.reserveOutput ?? 0);
    const strategy = args.strategy ?? "provider-default";
    if (!model)
        return {
            remainingCombined: undefined,
            remainingInput: undefined,
            percentUsed: 1,
        };
    const { inputMax, combinedMax } = model.context;
    const usedInput = usage.input ?? 0;
    const usedOutput = usage.output ?? 0;
    if (strategy === "input-only" || (!combinedMax && inputMax)) {
        const cap = inputMax ?? Number.POSITIVE_INFINITY;
        const remainingInput = Math.max(0, cap - usedInput);
        const percentUsed = cap === Number.POSITIVE_INFINITY
            ? 0
            : clamp01((usedInput + reserve) / cap);
        return { remainingInput, remainingCombined: undefined, percentUsed, model };
    }
    const cap = strategy === "combined"
        ? (combinedMax ?? inputMax ?? Number.POSITIVE_INFINITY)
        : (combinedMax ?? Number.POSITIVE_INFINITY);
    const used = usedInput + usedOutput;
    const remainingCombined = Math.max(0, cap - used - reserve);
    const percentUsed = cap === Number.POSITIVE_INFINITY ? 0 : clamp01((used + reserve) / cap);
    return {
        remainingCombined,
        remainingInput: inputMax ? Math.max(0, inputMax - usedInput) : undefined,
        percentUsed,
        model,
    };
}
/**
 * @deprecated Prefer getContext/getUsage with providers
 */
export function fitsContext({ modelId, tokens, reserveOutput, catalog, }) {
    const m = resolveModelFromCatalog(modelId, catalog);
    if (!m)
        return false;
    const cap = m.context.combinedMax ?? m.context.inputMax ?? Number.POSITIVE_INFINITY;
    return tokens + Math.max(0, reserveOutput ?? 0) <= cap;
}
/**
 * @deprecated Prefer getContext + filtering models externally
 */
export function pickModelFor(tokens, opts) {
    const buffer = Math.max(0, opts?.buffer ?? 0);
    const candidates = (opts?.catalog ? modelsFromCatalog(opts.catalog) : []);
    const filtered = candidates.filter((m) => {
        if (opts?.provider && m.provider !== opts.provider)
            return false;
        if (opts?.minStatus)
            if (!statusMeets(m.status, opts.minStatus))
                return false;
        const cap = m.context.combinedMax ?? m.context.inputMax ?? 0;
        return cap >= tokens + buffer;
    });
    filtered.sort((a, b) => (a.context.combinedMax ??
        a.context.inputMax ??
        Number.POSITIVE_INFINITY) -
        (b.context.combinedMax ?? b.context.inputMax ?? Number.POSITIVE_INFINITY));
    return filtered[0];
}
/**
 * @deprecated Prefer getTokenCosts/getUsage with providers
 */
export function estimateCost({ modelId, usage, catalog, }) {
    const model = resolveModelFromCatalog(modelId, catalog);
    if (!model?.pricing)
        return {};
    const base = normalizeUsage(usage);
    const breakdown = breakdownTokens(usage);
    const inputUSD = model.pricing.inputPerMTokens !== undefined
        ? (base.input / TOKENS_PER_MILLION) * model.pricing.inputPerMTokens
        : undefined;
    const outputUSD = model.pricing.outputPerMTokens !== undefined
        ? (base.output / TOKENS_PER_MILLION) * model.pricing.outputPerMTokens
        : undefined;
    const reasoningUSD = model.pricing.reasoningPerMTokens !== undefined &&
        typeof breakdown.reasoningTokens === "number"
        ? (breakdown.reasoningTokens / TOKENS_PER_MILLION) *
            model.pricing.reasoningPerMTokens
        : undefined;
    const cacheReadUSD = model.pricing.cacheReadPerMTokens !== undefined &&
        typeof breakdown.cacheReads === "number"
        ? (breakdown.cacheReads / TOKENS_PER_MILLION) *
            model.pricing.cacheReadPerMTokens
        : undefined;
    const cacheWriteUSD = model.pricing.cacheWritePerMTokens !== undefined &&
        typeof breakdown.cacheWrites === "number"
        ? (breakdown.cacheWrites / TOKENS_PER_MILLION) *
            model.pricing.cacheWritePerMTokens
        : undefined;
    const totalParts = [
        inputUSD,
        outputUSD,
        reasoningUSD,
        cacheReadUSD,
        cacheWriteUSD,
    ].filter((v) => typeof v === "number");
    const totalUSD = totalParts.length
        ? totalParts.reduce((a, b) => a + b, 0)
        : undefined;
    return {
        inputUSD,
        outputUSD,
        reasoningUSD,
        cacheReadUSD,
        cacheWriteUSD,
        totalUSD,
    };
}
/**
 * @deprecated Prefer getUsage/getTokenCosts
 */
export function consumedTokens(usage) {
    const u = normalizeUsage(usage);
    return u.total ?? u.input + u.output;
}
/**
 * Pure aggregator: summarize usage, cost, and context.
 * Requires an explicit catalog for model-specific fields.
 */
/**
 * @deprecated Prefer getUsage/getTokenCosts/getContext
 */
export function summarizeUsage(args) {
    const normalized = normalizeUsage(args.usage);
    const breakdown = breakdownTokens(args.usage);
    if (!args.modelId) {
        return {
            modelId: undefined,
            context: undefined,
            normalized,
            breakdown,
            costUSD: undefined,
            percentUsed: undefined,
        };
    }
    const rc = remainingContext({
        modelId: args.modelId,
        usage: args.usage ?? {},
        reserveOutput: args.reserveOutput,
        catalog: args.catalog,
    });
    const canonicalId = rc.model?.id ?? toModelId(args.modelId);
    const context = rc.model?.context ??
        (canonicalId
            ? getContextWindow(canonicalId, { catalog: args.catalog })
            : undefined);
    const costUSD = canonicalId
        ? estimateCost({
            modelId: canonicalId,
            usage: args.usage ?? {},
            catalog: args.catalog,
        })
        : undefined;
    return {
        modelId: canonicalId,
        context,
        normalized,
        breakdown,
        costUSD,
        percentUsed: rc.percentUsed,
    };
}
export function getTokenCosts(a, b, c) {
    const modelId = typeof a === "string" ? a : a.modelId;
    const usage = (typeof a === "string" ? b : a.usage) ?? {};
    const providers = (typeof a === "string" ? c : a.providers);
    const model = resolveModelFromCatalog(modelId, providers);
    if (!model?.pricing)
        return {};
    const base = normalizeUsage(usage);
    const breakdown = breakdownTokens(usage);
    const inputUSD = model.pricing.inputPerMTokens !== undefined
        ? (base.input / TOKENS_PER_MILLION) * model.pricing.inputPerMTokens
        : undefined;
    const outputUSD = model.pricing.outputPerMTokens !== undefined
        ? (base.output / TOKENS_PER_MILLION) * model.pricing.outputPerMTokens
        : undefined;
    const reasoningUSD = model.pricing.reasoningPerMTokens !== undefined &&
        typeof breakdown.reasoningTokens === "number"
        ? (breakdown.reasoningTokens / TOKENS_PER_MILLION) *
            model.pricing.reasoningPerMTokens
        : undefined;
    const cacheReadUSD = model.pricing.cacheReadPerMTokens !== undefined &&
        typeof breakdown.cacheReads === "number"
        ? (breakdown.cacheReads / TOKENS_PER_MILLION) *
            model.pricing.cacheReadPerMTokens
        : undefined;
    const cacheWriteUSD = model.pricing.cacheWritePerMTokens !== undefined &&
        typeof breakdown.cacheWrites === "number"
        ? (breakdown.cacheWrites / TOKENS_PER_MILLION) *
            model.pricing.cacheWritePerMTokens
        : undefined;
    const totalParts = [
        inputUSD,
        outputUSD,
        reasoningUSD,
        cacheReadUSD,
        cacheWriteUSD,
    ].filter((v) => typeof v === "number");
    const totalUSD = totalParts.length
        ? totalParts.reduce((a, b) => a + b, 0)
        : undefined;
    const res = {
        inputUSD,
        outputUSD,
        reasoningUSD,
        cacheReadUSD,
        cacheWriteUSD,
        totalUSD,
    };
    return {
        ...res,
        inputTokenUSD: res.inputUSD,
        outputTokenUSD: res.outputUSD,
        reasoningTokenUSD: res.reasoningUSD,
        cacheReadsUSD: res.cacheReadUSD,
        cacheWritesUSD: res.cacheWriteUSD,
    };
}
export function getContext(a, b) {
    const modelId = typeof a === "string" ? a : a.modelId;
    const providers = (typeof a === "string" ? b : a.providers);
    const model = resolveModelFromCatalog(modelId, providers);
    const inputMax = model?.context?.inputMax;
    const outputMax = model?.context?.outputMax;
    const combinedMax = model?.context?.combinedMax;
    const totalMax = combinedMax;
    return {
        inputMax,
        outputMax,
        combinedMax,
        totalMax,
        maxInput: inputMax,
        maxOutput: outputMax,
        maxTotal: totalMax,
    };
}
export function getUsage(a, b, c, _d) {
    const modelId = typeof a === "string" ? a : a.modelId;
    const usage = typeof a === "string" ? b : a.usage;
    const providers = (typeof a === "string" ? c : a.providers);
    const context = getContext(modelId, providers);
    const costUSD = getTokenCosts(modelId, usage, providers);
    return { context, costUSD };
}
/**
 * @deprecated Prefer getContext/getUsage
 */
export function percentRemaining(args) {
    const rc = remainingContext({
        modelId: args.modelId,
        usage: args.usage,
        reserveOutput: args.reserveOutput,
        catalog: args.catalog,
    });
    return 1 - rc.percentUsed;
}
/**
 * @deprecated Prefer getContext/getUsage
 */
export function shouldCompact(args) {
    const threshold = Math.max(0, Math.min(1, args.threshold ?? 0.85));
    const rc = remainingContext({
        modelId: args.modelId,
        usage: args.usage,
        reserveOutput: args.reserveOutput,
        catalog: args.catalog,
    });
    return rc.percentUsed >= threshold;
}
/**
 * @deprecated Prefer getContext/getUsage
 */
export function contextHealth(args) {
    const warnAt = Math.max(0, Math.min(1, args.warnAt ?? 0.75));
    const compactAt = Math.max(0, Math.min(1, args.compactAt ?? 0.85));
    const rc = remainingContext({
        modelId: args.modelId,
        usage: args.usage,
        reserveOutput: args.reserveOutput,
        catalog: args.catalog,
    });
    const remaining = rc.remainingCombined ?? rc.remainingInput;
    const status = rc.percentUsed >= compactAt
        ? "compact"
        : rc.percentUsed >= warnAt
            ? "warn"
            : "ok";
    return { percentUsed: rc.percentUsed, remaining, status };
}
/**
 * @deprecated Prefer getContext/getUsage
 */
export function tokensToCompact(args) {
    const model = resolveModelFromCatalog(args.modelId, args.catalog);
    if (!model)
        return 0;
    const u = normalizeUsage(args.usage);
    const used = u.input + u.output;
    const cap = model.context.combinedMax ?? model.context.inputMax;
    if (!cap || !Number.isFinite(cap))
        return 0;
    const reserve = Math.max(0, args.reserveOutput ?? 0);
    const targetPercent = Math.max(0, Math.min(1, args.targetPercent ?? 0.6));
    const targetUsedBudget = Math.max(0, cap * targetPercent - reserve);
    return Math.max(0, used - targetUsedBudget);
}
function clamp01(n) {
    return Math.max(0, Math.min(1, n));
}
function statusMeets(actual, min) {
    const order = {
        retired: 0,
        deprecated: 1,
        preview: 2,
        stable: 3,
    };
    return order[actual] >= order[min];
}
// Dynamic model resolution using either the installed registry or a live catalog
function resolveModelFromCatalog(idOrAlias, providers) {
    if (!providers)
        return undefined;
    const base = idOrAlias.trim().toLowerCase();
    const candidates = [base];
    // Accept provider/model by translating to provider:model
    if (base.includes("/")) {
        const i = base.indexOf("/");
        const p = base.slice(0, i);
        const rest = base.slice(i + 1);
        candidates.push(`${p}:${rest}`);
        // try dot→dash in model segment (e.g. claude-3.5 → claude-3-5)
        candidates.push(`${p}:${rest.replace(/(\d)\.(\d)/g, "$1-$2")}`);
    }
    // For provider:id, also try dot→dash variant
    if (base.includes(":")) {
        const i = base.indexOf(":");
        const p = base.slice(0, i);
        const rest = base.slice(i + 1);
        candidates.push(`${p}:${rest.replace(/(\d)\.(\d)/g, "$1-$2")}`);
    }
    // For providerless ids, also try dot→dash variant across providers
    if (!base.includes(":") && !base.includes("/")) {
        candidates.push(base.replace(/(\d)\.(\d)/g, "$1-$2"));
    }
    for (const key of candidates) {
        // provider-prefixed
        const idx = key.indexOf(":");
        if (idx > 0) {
            const providerKey = key.slice(0, idx);
            const mid = key.slice(idx + 1);
            for (const [provKey, prov] of iterateProviders(providers)) {
                if (mid) {
                    const m = prov?.models?.[mid];
                    if (m && (provKey === providerKey || providerKey.length > 0))
                        return mapModelsDevEntry(provKey, mid, m, prov);
                }
            }
        }
        // providerless: search across providers
        for (const [provKey, prov] of iterateProviders(providers)) {
            const m = prov?.models?.[key];
            if (m)
                return mapModelsDevEntry(provKey, key, m, prov);
        }
    }
    return undefined;
}
function mapModelsDevEntry(provider, modelId, m, prov) {
    const inputMods = Array.isArray(m?.modalities?.input)
        ? m.modalities?.input
        : [];
    const outputMods = Array.isArray(m?.modalities?.output)
        ? m.modalities?.output
        : [];
    const textIn = inputMods.includes("text");
    const imageIn = inputMods.includes("image");
    const textOut = outputMods.includes("text");
    const combinedMax = typeof m?.limit?.context === "number" ? m.limit.context : undefined;
    const inputMax = typeof m?.limit?.input === "number" ? m.limit.input : undefined;
    const outputMax = typeof m?.limit?.output === "number" ? m.limit.output : undefined;
    const pricing = m?.cost &&
        (typeof m.cost.input === "number" ||
            typeof m.cost.output === "number" ||
            typeof m.cost.reasoning === "number" ||
            typeof m.cost.cache_read === "number" ||
            typeof m.cost.cache_write === "number")
        ? {
            ...(typeof m.cost.input === "number"
                ? { inputPerMTokens: m.cost.input }
                : {}),
            ...(typeof m.cost.output === "number"
                ? { outputPerMTokens: m.cost.output }
                : {}),
            ...(typeof m.cost.reasoning === "number"
                ? { reasoningPerMTokens: m.cost.reasoning }
                : {}),
            ...(typeof m.cost.cache_read === "number"
                ? { cacheReadPerMTokens: m.cost.cache_read }
                : {}),
            ...(typeof m.cost.cache_write === "number"
                ? { cacheWritePerMTokens: m.cost.cache_write }
                : {}),
        }
        : undefined;
    return {
        id: `${provider}:${modelId}`,
        provider,
        vendorId: modelId,
        displayName: m?.name || modelId,
        family: modelId,
        status: "stable",
        context: Object.fromEntries(Object.entries({ combinedMax, inputMax, outputMax }).filter(([, v]) => typeof v === "number")),
        modalities: textIn || textOut || imageIn
            ? {
                ...(textIn && { textIn: true }),
                ...(textOut && { textOut: true }),
                ...(imageIn && { imageIn: true }),
            }
            : undefined,
        pricing,
        pricingSource: "models.dev",
        aliases: [`${provider}/${modelId}`],
        releasedAt: m?.release_date || undefined,
        source: prov?.doc ||
            prov.docs ||
            "https://models.dev",
        contextSource: prov?.doc ||
            prov.docs ||
            undefined,
        verifiedAt: m?.last_updated || undefined,
    };
}
function modelsFromCatalog(catalog) {
    const out = [];
    for (const [provKey, prov] of Object.entries(catalog)) {
        for (const mid of Object.keys(prov?.models ?? {})) {
            const m = prov.models?.[mid];
            out.push(mapModelsDevEntry(provKey, mid, m, prov));
        }
    }
    return out;
}
// Internal: iterate providers uniformly whether a full catalog or a single provider was supplied
function* iterateProviders(providers) {
    if (providers?.models) {
        const p = providers;
        const key = p.id || "provider";
        yield [key, p];
        return;
    }
    for (const [key, prov] of Object.entries(providers)) {
        // prov is ProviderInfo
        yield [key, prov];
    }
}
