export interface FeatureFlags {
  [key: string]: boolean;
}

const defaultFeatureFlags: FeatureFlags = {
  sanadAi: true,
  muhallilAhkam: true,
};

let featureFlags: FeatureFlags = { ...defaultFeatureFlags };

export const setFeatureFlags = (flags: FeatureFlags): void => {
  featureFlags = { ...defaultFeatureFlags, ...flags };
};

export const getFeatureFlag = (key: string): boolean => {
  return featureFlags[key] ?? false;
};

export const getAllFeatureFlags = (): FeatureFlags => {
  return { ...featureFlags };
};

export const resetFeatureFlags = (): void => {
  featureFlags = { ...defaultFeatureFlags };
};

