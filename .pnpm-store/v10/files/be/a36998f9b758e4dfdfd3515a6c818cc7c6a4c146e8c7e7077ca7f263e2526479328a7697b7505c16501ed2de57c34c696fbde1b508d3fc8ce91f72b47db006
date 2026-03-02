import type { ModelCatalog, ProviderInfo, ProviderModel } from "./types.js";
export type GetModelMetaOptions = {
    providers: ModelCatalog;
    provider?: string;
    model?: string;
    models?: readonly string[];
    id?: string;
};
/**
 * Get raw provider info or one/many model entries from a models.dev-compatible catalog.
 *
 * Overloads:
 * - getModelMeta({ providers, provider }) -> ProviderInfo | undefined
 * - getModelMeta({ providers, provider, model }) -> ProviderModel | undefined
 * - getModelMeta({ providers, provider, models }) -> Record<id, ProviderModel>
 * - getModelMeta({ providers, id }) -> ProviderModel | undefined (accepts 'provider:model' or 'provider/model')
 *
 * Positional overloads are supported for back-compat:
 * - getModelMeta(providers, providerOrId)
 * - getModelMeta(providers, provider, modelId)
 * - getModelMeta(providers, provider, modelIds[])
 */
export declare function getModelMeta(opts: {
    providers: ModelCatalog;
    provider: string;
    model?: undefined;
    models?: undefined;
    id?: undefined;
}): ProviderInfo | undefined;
export declare function getModelMeta(opts: {
    providers: ModelCatalog;
    provider: string;
    model: string;
    models?: undefined;
    id?: undefined;
}): ProviderModel | undefined;
export declare function getModelMeta(opts: {
    providers: ModelCatalog;
    provider: string;
    models: readonly string[];
    model?: undefined;
    id?: undefined;
}): Record<string, ProviderModel>;
export declare function getModelMeta(opts: {
    providers: ModelCatalog;
    id: string;
    provider?: string;
    model?: string;
    models?: undefined;
}): ProviderModel | undefined;
export declare function getModelMeta(opts: GetModelMetaOptions): ProviderInfo | ProviderModel | Record<string, ProviderModel> | undefined;
export declare function getModelMeta(providers: ModelCatalog, providerOrId: string): ProviderInfo | ProviderModel | undefined;
export declare function getModelMeta(providers: ModelCatalog, providerOrId: string, modelId: string): ProviderModel | undefined;
export declare function getModelMeta(providers: ModelCatalog, providerOrId: string, modelIds: readonly string[]): Record<string, ProviderModel>;
//# sourceMappingURL=catalog.d.ts.map