/** Procedure completion types (`clinical-service.yaml`); Clinical never stores money. */
export type ExtraItemType =
  | 'ADDITIONAL_MATERIAL'
  | 'ADDITIONAL_PROCEDURE'
  | 'COMPLEXITY_ADJUSTMENT'
  | 'OTHER_AUTHORIZED_CHARGE';

export const EXTRA_ITEM_TYPE_LABELS: Record<ExtraItemType, string> = {
  ADDITIONAL_MATERIAL: 'Material adicional',
  ADDITIONAL_PROCEDURE: 'Procedimiento adicional',
  COMPLEXITY_ADJUSTMENT: 'Ajuste por complejidad',
  OTHER_AUTHORIZED_CHARGE: 'Otro cargo autorizado',
};

export interface ExtraItem {
  readonly sourceRecordId: string;
  readonly type: ExtraItemType;
  readonly code?: string;
  readonly quantity: string;
  readonly description: string;
  readonly clinicalReason: string;
}

/** UI draft: materials used vs. additional clinical requirements. */
export interface ExtraItemDraft extends Omit<ExtraItem, 'sourceRecordId'> {
  readonly category: 'MATERIAL' | 'REQUIREMENT';
}

export interface ProcedureCompletionRequest {
  readonly expectedVersion: number;
  readonly materialsUsed: readonly ExtraItem[];
  readonly additionalRequirements: readonly ExtraItem[];
}

export interface CareClosure {
  readonly id: string;
  readonly procedureId: string;
  readonly appointmentId: string;
  readonly status: 'CLOSURE_PENDING' | 'CLOSURE_COMPLETED' | 'CLOSURE_FAILED';
  readonly appointmentOutcome?: 'PENDING' | 'COMPLETED';
  readonly billingOutcome?: 'PENDING' | 'COMPLETED';
  readonly failureReason?: string;
  readonly version: number;
}

/** Contract pattern: positive exact decimal, at most four fractional digits. */
const QUANTITY = /^(?!0(?:\.0{1,4})?$)(?:0|[1-9][0-9]*)(?:\.[0-9]{1,4})?$/;

/** Returns an error message, or null when the extra satisfies CLN-008. */
export function validateExtraItem(item: ExtraItemDraft): string | null {
  if (!QUANTITY.test(item.quantity))
    return 'La cantidad debe ser un decimal positivo con máximo 4 decimales.';
  if (!item.description.trim() || item.description.length > 500)
    return 'La descripción es obligatoria (máximo 500 caracteres).';
  if (!item.clinicalReason.trim() || item.clinicalReason.length > 1000)
    return 'Cada extra requiere justificación clínica (máximo 1000 caracteres).';
  if ((item.code?.length ?? 0) > 80)
    return 'El código no puede superar 80 caracteres.';
  return null;
}
