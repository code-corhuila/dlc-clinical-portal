/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** IANA clinic timezone for displayed dates; defaults to America/Bogota. */
  readonly VITE_CLINIC_TIMEZONE?: string;
  /** Session permissions that grant an Administrator clinical read/write; same values as the Clinical API. */
  readonly VITE_CLINICAL_READ_PERMISSION?: string;
  readonly VITE_CLINICAL_WRITE_PERMISSION?: string;
}
