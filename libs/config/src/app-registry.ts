import { AppMount } from './types';
import { getFeatureFlag } from './feature-flags';

export interface AppMetadata {
  name: string;
  bundlePath: string;
  featureFlag: string;
  globalName: keyof Window;
}

export const APP_REGISTRY: AppMetadata[] = [
  {
    name: 'sanad-ai',
    bundlePath: '/packages/sanad-ai/index.js',
    featureFlag: 'sanadAi',
    globalName: 'SANAD_APP',
  },
  {
    name: 'muhallil-ahkam',
    bundlePath: '/packages/muhallil-ahkam/index.js',
    featureFlag: 'muhallilAhkam',
    globalName: 'AHKAM_APP',
  },
];

export const getEnabledApps = (): AppMetadata[] => {
  return APP_REGISTRY.filter((app) => getFeatureFlag(app.featureFlag));
};

export const getAppMetadata = (name: string): AppMetadata | undefined => {
  return APP_REGISTRY.find((app) => app.name === name);
};

export const loadAppMount = (globalName: keyof Window): AppMount | undefined => {
  const mount = window[globalName];
  if (mount && typeof mount === 'object' && 'mount' in mount && 'unmount' in mount) {
    return mount as AppMount;
  }
  return undefined;
};

