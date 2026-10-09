export type ClinicalEntryRequestKind =
  'CONSULTATION' | 'DIAGNOSIS' | 'EVOLUTION';

export interface ClinicalEntryRequest {
  readonly kind: ClinicalEntryRequestKind;
  readonly text: string;
  readonly consultationId?: string;
}

export function validateClinicalEntryRequest(
  kind: ClinicalEntryRequestKind,
  text: string,
  consultationId?: string,
): string | ClinicalEntryRequest {
  if (text.trim() === '') return 'La narrativa clínica es obligatoria.';
  if (text.length > 10000)
    return 'La narrativa clínica no puede superar 10000 caracteres.';
  if (kind !== 'DIAGNOSIS') return { kind, text };
  // CLN-008: never infer the latest consultation.
  if (!consultationId) return 'Seleccione la consulta asociada al diagnóstico.';

  return { kind, text, consultationId };
}
