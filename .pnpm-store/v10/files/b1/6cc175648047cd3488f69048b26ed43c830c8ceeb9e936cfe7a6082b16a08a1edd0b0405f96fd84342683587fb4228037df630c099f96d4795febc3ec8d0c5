import type { Model } from "@tokenlens/core/types";
/**
 * @deprecated Use `@tokenlens/core/registry` with a catalog from
 * `@tokenlens/models` or `@tokenlens/fetch` instead.
 */
export declare const MODEL_IDS: readonly string[];
/**
 * @deprecated Use `@tokenlens/core/registry` created from your own catalog.
 */
export declare const models: Readonly<Record<string, Model>>;
/**
 * @deprecated Use `@tokenlens/core/registry` created from your own catalog.
 */
export declare const aliases: Readonly<Record<string, string>>;
/**
 * @deprecated Use `@tokenlens/core/registry` created from your own catalog.
 */
export declare const getModelRaw: (id: string) => Model | undefined;
/**
 * @deprecated Use `@tokenlens/core/registry` created from your own catalog.
 */
export declare const resolveModel: (idOrAlias: string) => Model | undefined;
/**
 * @deprecated Prefer calling `isModelId` on a registry you create via
 * `@tokenlens/core/registry`. Note: model ids are plain `string` in v1.3+;
 * this function is a runtime guard only.
 */
export declare const isModelId: (value: string) => value is ModelId;
/**
 * @deprecated Prefer `assertModelId` from a registry you create via
 * `@tokenlens/core/registry`. Note: model ids are plain `string` in v1.3+;
 * this is a runtime assertion only.
 */
export declare const assertModelId: (value: string) => asserts value is ModelId;
/**
 * @deprecated Use `@tokenlens/core/registry` created from your own catalog.
 */
export declare const listModels: (filter?: {
    provider?: import("@tokenlens/core/types").Provider;
    status?: import("@tokenlens/core/types").Status;
}) => Model[];
/**
 * @deprecated Model ids are plain `string` in v1.3+. Migrate to `string`.
 * If you need a literal union, derive it from your own curated catalog
 * array in application code (not from `createRegistry`).
 */
export type ModelId = (typeof MODEL_IDS)[number];
//# sourceMappingURL=registry.d.ts.map