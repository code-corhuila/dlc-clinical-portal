import {
  resolveClinicalAccess,
  resolveClinicalWriteAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';
import {
  validateTreatmentDraft,
  type PlanTreatmentRequest,
  type Treatment,
  type TreatmentDraft,
} from '../model/treatment';

/** Host-provided treatments boundary; it deliberately contains no HTTP details. */
export interface TreatmentPort {
  listTreatments(patientId: string): Promise<readonly Treatment[]>;
  planTreatment(
    request: PlanTreatmentRequest,
    idempotencyKey: string,
  ): Promise<Treatment>;
  startTreatment(
    treatmentId: string,
    expectedVersion: number,
    idempotencyKey: string,
  ): Promise<Treatment>;
}

export interface TreatmentAccess {
  readonly patientId: string;
  readonly role: ClinicalRole | null;
  readonly clinicalAuthorized: boolean;
}

/** Writes carry one Idempotency-Key per user intent, reused on retries (Annex H). */
export interface TreatmentWriteAccess extends TreatmentAccess {
  readonly idempotencyKey: string;
}

function requireIntentKey(idempotencyKey: string): void {
  if (!idempotencyKey)
    throw {
      code: 'INVALID',
      message: 'Falta la clave de idempotencia de la operación.',
    };
}

/** Reads and plans treatments; read and write permissions are checked apart. */
export class TreatmentPlan {
  constructor(private readonly port: TreatmentPort) {}

  async list(access: TreatmentAccess): Promise<readonly Treatment[]> {
    if (
      resolveClinicalAccess(access.role, access.clinicalAuthorized) !==
      'granted'
    )
      throw { code: 'FORBIDDEN' };
    return this.port.listTreatments(access.patientId);
  }

  /** PLANNED to IN_PROGRESS only, guarded by the treatment version. */
  async start(
    access: TreatmentWriteAccess,
    treatment: Treatment,
  ): Promise<void> {
    this.requireWrite(access);
    requireIntentKey(access.idempotencyKey);
    if (treatment.status !== 'PLANNED')
      throw {
        code: 'INVALID',
        message: 'Solo un tratamiento planificado puede iniciarse.',
      };
    await this.port.startTreatment(
      treatment.id,
      treatment.version,
      access.idempotencyKey,
    );
  }

  async plan(
    access: TreatmentWriteAccess,
    draft: TreatmentDraft,
  ): Promise<void> {
    this.requireWrite(access);
    requireIntentKey(access.idempotencyKey);
    const message = validateTreatmentDraft(draft);
    if (message) throw { code: 'INVALID', message };
    await this.port.planTreatment(
      { patientId: access.patientId, ...draft },
      access.idempotencyKey,
    );
  }

  private requireWrite(access: TreatmentAccess): void {
    if (
      resolveClinicalWriteAccess(access.role, access.clinicalAuthorized) !==
      'granted'
    )
      throw { code: 'FORBIDDEN' };
  }
}
