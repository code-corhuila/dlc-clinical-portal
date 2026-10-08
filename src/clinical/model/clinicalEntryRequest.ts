export type ClinicalEntryRequestKind = 'CONSULTATION' | 'EVOLUTION';

export interface ClinicalEntryRequest {
  readonly kind: ClinicalEntryRequestKind;
  readonly text: string;
}

export function validateClinicalEntryRequest(
  kind: ClinicalEntryRequestKind,
  text: string,
): string | ClinicalEntryRequest {
  if (text.trim() === '') return 'La narrativa clínica es obligatoria.';
  if (text.length > 10000)
    return 'La narrativa clínica no puede superar 10000 caracteres.';

  return { kind, text };
}
