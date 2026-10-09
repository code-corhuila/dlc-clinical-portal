import {
  resolveClinicalWriteAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';
import {
  validateClinicalEntryRequest,
  type ClinicalEntryRequest,
} from '../model/clinicalEntryRequest';

/** Host-provided write boundary; it deliberately contains no HTTP details. */
export interface ClinicalEntryWritePort {
  findRecordId(patientId: string): Promise<string>;
  /** `idempotencyKey` maps to the contract `Idempotency-Key` header. */
  appendEntry(
    recordId: string,
    request: ClinicalEntryRequest,
    idempotencyKey: string,
  ): Promise<void>;
}

export interface ClinicalWriteContext {
  readonly patientId: string;
  readonly role: ClinicalRole | null;
  readonly clinicalWriteAuthorized: boolean;
  /** One key per user intent, reused when that intent is retried. */
  readonly idempotencyKey: string;
}

export class ClinicalEntryWriteError extends Error {
  constructor(
    readonly code: 'FORBIDDEN' | 'INVALID',
    message: string,
  ) {
    super(message);
  }
}

const SUPPORTED_KINDS = ['CONSULTATION', 'DIAGNOSIS', 'EVOLUTION'];

/** Records CONSULTATION, DIAGNOSIS and EVOLUTION entries for an authorized writer. */
export class RecordClinicalEntry {
  constructor(private readonly port: ClinicalEntryWritePort) {}

  async execute(
    context: ClinicalWriteContext,
    request: ClinicalEntryRequest,
  ): Promise<void> {
    const access = resolveClinicalWriteAccess(
      context.role,
      context.clinicalWriteAuthorized,
    );
    if (access !== 'granted')
      throw new ClinicalEntryWriteError(
        'FORBIDDEN',
        'No tiene autorización clínica para registrar entradas.',
      );
    if (!SUPPORTED_KINDS.includes(request.kind))
      throw new ClinicalEntryWriteError(
        'INVALID',
        'Tipo de entrada no admitido.',
      );
    const valid = validateClinicalEntryRequest(
      request.kind,
      request.text,
      request.consultationId,
    );
    if (typeof valid === 'string')
      throw new ClinicalEntryWriteError('INVALID', valid);

    if (!context.idempotencyKey)
      throw new ClinicalEntryWriteError(
        'INVALID',
        'Falta la clave de idempotencia de la operación.',
      );

    const recordId = await this.port.findRecordId(context.patientId);
    await this.port.appendEntry(recordId, valid, context.idempotencyKey);
  }
}
