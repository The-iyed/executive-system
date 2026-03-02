import type { Model, Provider, Status } from "./types.js";
export type Registry = ReturnType<typeof createRegistry>;
export declare function createRegistry(all: readonly Model[]): {
    readonly MODEL_IDS: readonly string[];
    readonly models: Readonly<Record<string, Model>>;
    readonly aliases: Readonly<Record<string, string>>;
    readonly getModelRaw: (id: string) => Model | undefined;
    readonly resolveModel: (idOrAlias: string) => Model | undefined;
    readonly resolveModels: (idOrAlias: string) => Model[];
    readonly isModelId: (value: string) => boolean;
    readonly assertModelId: (value: string) => asserts value is string;
    readonly listModels: (filter?: {
        provider?: Provider;
        status?: Status;
    }) => Model[];
};
//# sourceMappingURL=registry.d.ts.map