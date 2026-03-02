/** @deprecated Internal; consider using getModels/fetchModels + getContextData */
export function sourceFromModels(models) {
    const byId = new Map();
    const byAlias = new Map();
    for (const m of models) {
        byId.set(m.id.toLowerCase(), m);
    }
    for (const m of models) {
        const pref = `${m.provider}:`;
        if (m.id.startsWith(pref))
            byAlias.set(m.id.slice(pref.length).toLowerCase(), m.id);
        if (m.vendorId)
            byAlias.set(m.vendorId.toLowerCase(), m.id);
        if (m.family)
            byAlias.set(m.family.toLowerCase(), m.id);
        for (const a of m.aliases ?? [])
            byAlias.set(a.toLowerCase(), m.id);
    }
    const resolve = (idOrAlias) => {
        const key = idOrAlias.trim().toLowerCase();
        const canonical = byId.has(key) ? key : byAlias.get(key);
        return canonical ? byId.get(canonical) : undefined;
    };
    const list = (filter) => models.filter((m) => filter?.provider ? m.provider === filter.provider : true);
    return { resolve, list };
}
/** @deprecated Internal; consider using getModels/fetchModels + getContextData */
export function sourceFromCatalog(catalog) {
    const mapEntry = (provKey, mid, m, prov) => {
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
            id: `${provKey}:${mid}`,
            provider: provKey,
            vendorId: mid,
            displayName: m?.name || mid,
            family: mid,
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
            aliases: [`${provKey}/${mid}`],
            releasedAt: m?.release_date || undefined,
            source: prov?.doc ||
                prov?.docs ||
                "https://models.dev",
            contextSource: prov?.doc ||
                prov?.docs ||
                undefined,
            verifiedAt: m?.last_updated || undefined,
        };
    };
    const all = [];
    for (const [provKey, prov] of Object.entries(catalog)) {
        for (const mid of Object.keys(prov?.models ?? {})) {
            const m = prov.models[mid];
            all.push(mapEntry(provKey, mid, m, prov));
        }
    }
    return sourceFromModels(all);
}
/** @deprecated Internal; consider using getModels with provider filters */
export function selectStaticModels(providerArrays, pick) {
    const flatten = [];
    for (const arr of providerArrays) {
        for (const m of arr) {
            const mm = m;
            if (!mm?.id || !mm?.provider)
                continue;
            const ids = pick?.[mm.provider];
            if (!ids || ids.length === 0) {
                flatten.push(mm);
            }
            else {
                const short = mm.id.includes(":") ? mm.id.split(":")[1] : mm.id;
                if (ids.includes(mm.id) ||
                    ids.includes(short) ||
                    (mm.vendorId && ids.includes(mm.vendorId))) {
                    flatten.push(mm);
                }
            }
        }
    }
    return flatten;
}
