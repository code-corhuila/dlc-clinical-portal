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

export interface TreatmentDraft {
  readonly diagnosisId?: string;
  readonly clinicalReason?: string;
  readonly procedures: readonly {
    readonly procedureCode: string;
    readonly appointmentId: string;
  }[];
}

export interface PlanTreatmentRequest extends TreatmentDraft {
  readonly patientId: string;
}

export const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  PLANNED: 'Planificado',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

/** Returns an error message, or null when the draft satisfies the contract. */
export function validateTreatmentDraft(draft: TreatmentDraft): string | null {
  if (!draft.diagnosisId && !draft.clinicalReason?.trim())
    return 'Indique un diagnóstico o un motivo clínico.';
  if ((draft.clinicalReason?.length ?? 0) > 1000)
    return 'El motivo clínico no puede superar 1000 caracteres.';
  if (draft.procedures.length === 0)
    return 'Seleccione al menos un procedimiento.';
  if (draft.procedures.some((item) => !item.procedureCode.trim()))
    return 'Cada procedimiento requiere un código.';
  if (draft.procedures.some((item) => !item.appointmentId))
    return 'Los procedimientos requieren una cita en atención.';
  return null;
}
