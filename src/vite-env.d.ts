/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Development-only demo flag; never enabled in a production build. */
  readonly VITE_CLINICAL_DEMO?: string;
}
