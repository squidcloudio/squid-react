/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SQUID_APP_ID: string;
  readonly VITE_SQUID_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
