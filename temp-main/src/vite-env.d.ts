/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MESSAGES_WS_URL?: string;
  readonly VITE_MESSAGES_SERVER?: string;
  readonly VITE_MAP_SERVER?: string;
  readonly VITE_USE_LOCAL_DEMO?: string;
  readonly VITE_MAP_SOURCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
