import {
  resolveClinicalWriteAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';
import {
  validateExtraItem,
  type CareClosure,
  type ExtraItem,
  type ExtraItemDraft,
  type ProcedureCompletionRequest,
} from '../model/procedureCompletion';

/** Host-provided completion boundary; it deliberately contains no HTTP details. */
export interface ProcedureCompletionPort {
  completeProcedure(
    procedureId: string,
    request: ProcedureCompletionRequest,
    idempotencyKey: string,
  ): Promise<CareClosure>;
}

export interface CompletionAccess {
  readonly role: ClinicalRole | null;
  readonly clinicalWriteAuthorized: boolean;
  /** One key per user intent, reused on retries (Annex H). */
  readonly idempotencyKey: string;
}

/**
 * Completes clinical work for one procedure with justified materials and
 * needs (CLN-006/CLN-008). Prices are entered later through Billing.
 */
export class CompleteProcedure {
  constructor(
    private readonly port: ProcedureCompletionPort,
    private readonly newSourceRecordId: () => string,
  ) {}

  async execute(
    access: CompletionAccess,
    target: { readonly procedureId: string; readonly treatmentVersion: number },
    extras: readonly ExtraItemDraft[],
  ): Promise<{ closure: CareClosure; extras: readonly ExtraItem[] }> {
    const granted = resolveClinicalWriteAccess(
      access.role,
      access.clinicalWriteAuthorized,
    );
    if (granted !== 'granted') throw { code: 'FORBIDDEN' };
    if (!access.idempotencyKey)
      throw {
        code: 'INVALID',
        message: 'Falta la clave de idempotencia de la operación.',
      };
    const message = extras.map(validateExtraItem).find(Boolean);
    if (message) throw { code: 'INVALID', message };

    const items = extras.map(({ category, code, ...item }) => ({
      category,
      item: {
        sourceRecordId: this.newSourceRecordId(),
        ...item,
        ...(code?.trim() ? { code } : {}),
      } as ExtraItem,
    }));
    const pick = (category: ExtraItemDraft['category']) =>
      items.filter((entry) => entry.category === category).map((e) => e.item);
    const closure = await this.port.completeProcedure(
      target.procedureId,
      {
        expectedVersion: target.treatmentVersion,
        materialsUsed: pick('MATERIAL'),
        additionalRequirements: pick('REQUIREMENT'),
      },
      access.idempotencyKey,
    );
    // Extras still need a manual price entered through Billing (BIL-008).
    return { closure, extras: items.map((entry) => entry.item) };
  }
}
