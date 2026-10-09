/** Treatment contract types (`clinical-service.yaml`); no monetary fields. */
export type TreatmentStatus =
  'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PlannedProcedure {
  readonly id: string;
  readonly procedureCode: string;
  readonly appointmentId: string;
  readonly status: TreatmentStatus;
}

export interface Treatment {
  readonly id: string;
  readonly patientId: string;
  readonly diagnosisId?: string;
  readonly clinicalReason?: string;
  readonly status: TreatmentStatus;
  readonly procedures: readonly PlannedProcedure[];
  readonly createdAt?: string;
  readonly version: number;
}

export const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  PLANNED: 'Planificado',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};
