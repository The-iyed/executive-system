import type { Model, ModelCatalog } from "@tokenlens/core";
export type ModelSource = {
    resolve: (idOrAlias: string) => Model | undefined;
    list: (filter?: {
        provider?: string;
    }) => Model[];
};
/** @deprecated Internal; consider using getModels/fetchModels + getContextData */
export declare function sourceFromModels(models: readonly Model[]): ModelSource;
/** @deprecated Internal; consider using getModels/fetchModels + getContextData */
export declare function sourceFromCatalog(catalog: ModelCatalog): ModelSource;
/** @deprecated Internal; consider using getModels with provider filters */
export declare function selectStaticModels(providerArrays: ReadonlyArray<ReadonlyArray<Model>> | ReadonlyArray<ReadonlyArray<Record<string, unknown>>>, pick?: Record<string, ReadonlyArray<string> | undefined>): Model[];
