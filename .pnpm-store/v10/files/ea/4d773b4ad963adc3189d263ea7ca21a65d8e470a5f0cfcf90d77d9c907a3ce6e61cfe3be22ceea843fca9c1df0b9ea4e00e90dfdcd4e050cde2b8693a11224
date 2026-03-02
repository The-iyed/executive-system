import { toModelId } from "./id.js";
export function getModelMeta(a, b, c) {
    let opts;
    if (typeof a === "object" && "providers" in a && b === undefined) {
        opts = a;
    }
    else {
        opts = {
            providers: a,
            provider: b,
            model: typeof c === "string" ? c : undefined,
            models: Array.isArray(c) ? c : undefined,
        };
    }
    let provider = opts.provider;
    let mm = opts.models ?? opts.model;
    if (!mm && opts.id) {
        const canonical = toModelId(opts.id) ?? opts.id.replace("/", ":");
        const idx = canonical.indexOf(":");
        if (idx > 0) {
            provider = canonical.slice(0, idx);
            mm = canonical.slice(idx + 1);
        }
    }
    if (!provider)
        return undefined;
    const provInfo = opts.providers[provider];
    if (!provInfo)
        return undefined;
    if (mm === undefined)
        return provInfo;
    if (typeof mm === "string") {
        return provInfo.models[mm];
    }
    const out = {};
    for (const id of mm) {
        const hit = provInfo.models[id];
        if (hit)
            out[id] = hit;
    }
    return out;
}
//# sourceMappingURL=catalog.js.map