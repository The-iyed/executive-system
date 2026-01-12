export interface AppConfig {
  apiBaseUrl?: string;
  basicAuth?: {
    username?: string;
    password?: string;
    authString?: string; // base64 encoded username:password
  };
  featureFlags?: Record<string, boolean>;
  [key: string]: unknown;
}

export interface AppMount {
  mount: (el: HTMLElement, config?: AppConfig) => void;
  unmount: () => void;
}

declare global {
  interface Window {
    SANAD_APP?: AppMount;
    AHKAM_APP?: AppMount;
    SanadAiV3?: {
      open: (container?: HTMLElement) => void;
      toggle: (container?: HTMLElement) => void;
      close: () => void;
      isOpen: () => boolean;
    };
    SanadAi?: {
      open: (container?: HTMLElement, config?: any) => void;
      toggle: (container?: HTMLElement, config?: any) => void;
      close: () => void;
      isOpen: () => boolean;
    };
    MuhallilAhkam?: {
      open: (container?: HTMLElement) => void;
      toggle: (container?: HTMLElement) => void;
      close: () => void;
      isOpen: () => boolean;
    };
    AiStatsBot?: {
      open: () => void;
      close: () => void;
      toggle: () => void;
    };
    StatsBot?: {
      open: () => void;
      close: () => void;
      toggle: () => void;
    };
    LegalAssistant?: {
      open: () => void;
      close: () => void;
      toggle: () => void;
    };
  }
}

