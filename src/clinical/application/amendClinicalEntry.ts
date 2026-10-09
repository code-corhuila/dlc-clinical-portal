import {
  resolveClinicalWriteAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';

export interface ClinicalAmendmentRequest {
  readonly text: string;
  readonly reason: string;
  readonly expectedVersion: number;
}

/** Host-provided amendment boundary; it deliberately contains no HTTP details. */
export interface ClinicalEntryAmendPort {
  amendEntry(
    entryId: string,
    request: ClinicalAmendmentRequest,
    idempotencyKey: string,
  ): Promise<void>;
}

export interface ClinicalAmendAccess {
  readonly role: ClinicalRole | null;
  readonly clinicalWriteAuthorized: boolean;
  readonly idempotencyKey: string;
}

/** Appends a linked correction; the original entry is never overwritten. */
export class AmendClinicalEntry {
  constructor(private readonly port: ClinicalEntryAmendPort) {}

  async execute(
    access: ClinicalAmendAccess,
    entry: { readonly id: string; readonly version: number },
    correction: { readonly text: string; readonly reason: string },
  ): Promise<void> {
    const granted = resolveClinicalWriteAccess(
      access.role,
      access.clinicalWriteAuthorized,
    );
    if (granted !== 'granted') throw { code: 'FORBIDDEN' };
    const text = correction.text.trim();
    const reason = correction.reason.trim();
    if (!text || correction.text.length > 10000)
      throw { code: 'INVALID', message: 'El texto corregido es obligatorio.' };
    if (!reason || correction.reason.length > 1000)
      throw {
        code: 'INVALID',
        message: 'Indique el motivo de la corrección (máximo 1000 caracteres).',
      };
    if (!access.idempotencyKey)
      throw {
        code: 'INVALID',
        message: 'Falta la clave de idempotencia de la operación.',
      };
    await this.port.amendEntry(
      entry.id,
      {
        text: correction.text,
        reason: correction.reason,
        expectedVersion: entry.version,
      },
      access.idempotencyKey,
    );
  }
}
