import type { ClinicalAccessDecision } from './clinicalAccess';
import type {
  ClinicalEntry,
  ClinicalEntryKind,
  ClinicalEntryPage,
} from './clinicalEntry';

const CLINICAL_ENTRY_LABELS: Partial<Record<ClinicalEntryKind, string>> = {
  CONSULTATION: 'Consulta',
  DIAGNOSIS: 'Diagnóstico',
  EVOLUTION: 'Evolución',
};

/** Spanish label per contract kind; unapproved kinds keep their verbatim value. */
export function clinicalEntryLabel(kind: ClinicalEntryKind): string {
  return CLINICAL_ENTRY_LABELS[kind] ?? kind;
}

export type ClinicalRecordStatus =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly page: ClinicalEntryPage }
  | { readonly kind: 'forbidden' }
  | { readonly kind: 'error'; readonly message: string };

export type ClinicalRecordViewModel =
  | { readonly state: 'loading' }
  | { readonly state: 'empty' }
  | { readonly state: 'data'; readonly entries: readonly ClinicalEntry[] }
  | { readonly state: 'forbidden' }
  | { readonly state: 'error'; readonly message: string };

/** Denied access wins so protected narrative never reaches the DOM. */
export function toClinicalRecordViewModel(
  access: ClinicalAccessDecision,
  status: ClinicalRecordStatus,
): ClinicalRecordViewModel {
  if (access === 'denied' || status.kind === 'forbidden') {
    return { state: 'forbidden' };
  }
  if (status.kind === 'loading') {
    return { state: 'loading' };
  }
  if (status.kind === 'error') {
    return { state: 'error', message: status.message };
  }
  return status.page.data.length === 0
    ? { state: 'empty' }
    : { state: 'data', entries: status.page.data };
}
