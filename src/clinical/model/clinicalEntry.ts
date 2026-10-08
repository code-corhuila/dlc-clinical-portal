/** Clinical entry contract types for GET /api/v1/clinical-records/{id}/entries. */

export type ClinicalEntryKind =
  'CONSULTATION' | 'DIAGNOSIS' | 'EVOLUTION' | 'ANTECEDENT' | 'ALLERGY';

export interface ClinicalEntry {
  readonly id: string;
  readonly recordId: string;
  readonly kind: ClinicalEntryKind;
  readonly text: string;
  readonly code?: string;
  readonly appointmentId?: string;
  readonly consultationId?: string;
  readonly authorId: string;
  readonly amendsEntryId?: string;
  readonly amendmentReason?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly version: number;
}

export interface PaginatedMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface ClinicalEntryPage {
  readonly data: readonly ClinicalEntry[];
  readonly meta: PaginatedMeta;
}
