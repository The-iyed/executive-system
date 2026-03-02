import { toModelId } from "./id.js";
export function createRegistry(all) {
    const MODEL_IDS = all.map((m) => m.id);
    const models = Object.freeze(Object.fromEntries(all.map((m) => [m.id, m])));
    const aliasEntries = [];
    for (const m of all) {
        const providerPrefix = `${m.provider}:`;
        if (m.vendorId)
            aliasEntries.push([m.vendorId.toLowerCase(), m.id]);
        if (m.family)
            aliasEntries.push([m.family.toLowerCase(), m.id]);
        if (m.id.startsWith(providerPrefix))
            aliasEntries.push([
                m.id.slice(providerPrefix.length).toLowerCase(),
                m.id,
            ]);
        for (const a of m.aliases ?? [])
            aliasEntries.push([a.toLowerCase(), m.id]);
    }
    const aliasMap = new Map();
    for (const [k, v] of aliasEntries)
        if (!aliasMap.has(k))
            aliasMap.set(k, v);
    const aliases = Object.freeze(Object.fromEntries(aliasMap));
    function getModelRaw(id) {
        return models[id];
    }
    function resolveModel(idOrAlias) {
        const key = idOrAlias.trim().toLowerCase();
        const canonical = models[key]
            ? key
            : aliases[key];
        return canonical ? models[canonical] : undefined;
    }
    function resolveModels(idOrAlias) {
        const input = idOrAlias.trim();
        if (!input)
            return [];
        const key = input.toLowerCase();
        const out = [];
        // Try canonical direct match (already lowercase comparisons below)
        if (models[key]) {
            out.push(models[key]);
        }
        // Normalize gateway style ids to canonical for matching
        const normalized = toModelId(input);
        if (normalized) {
            const nkey = normalized.toLowerCase();
            if (models[nkey]) {
                const m = models[nkey];
                if (!out.includes(m))
                    out.push(m);
            }
        }
        // Collect all possible alias keys for every model and match all
        const aliasMatches = [];
        for (const m of Object.values(models)) {
            const providerPrefix = `${m.provider}:`;
            const aliasKeys = [];
            if (m.vendorId)
                aliasKeys.push(m.vendorId.toLowerCase());
            if (m.family)
                aliasKeys.push(m.family.toLowerCase());
            if (m.id.startsWith(providerPrefix))
                aliasKeys.push(m.id.slice(providerPrefix.length).toLowerCase());
            for (const a of m.aliases ?? [])
                aliasKeys.push(a.toLowerCase());
            if (aliasKeys.includes(key))
                aliasMatches.push(m);
        }
        for (const m of aliasMatches)
            if (!out.includes(m))
                out.push(m);
        return out;
    }
    function isModelId(value) {
        return MODEL_IDS.includes(value);
    }
    function assertModelId(value) {
        if (!isModelId(value)) {
            throw new Error(`Unknown model id: ${value}`);
        }
    }
    function listModels(filter) {
        const arr = Object.values(models);
        return arr.filter((m) => {
            if (filter?.provider && m.provider !== filter.provider)
                return false;
            if (filter?.status && m.status !== filter.status)
                return false;
            return true;
        });
    }
    return {
        MODEL_IDS,
        models: models,
        aliases: aliases,
        getModelRaw,
        resolveModel,
        resolveModels,
        isModelId,
        assertModelId,
        listModels,
    };
}
//# sourceMappingURL=registry.js.map