import {
  resolveClinicalAccess,
  resolveClinicalWriteAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';
import type { CareClosure } from '../model/procedureCompletion';

/** Host-provided care-closure boundary; it deliberately contains no HTTP details. */
export interface CareClosurePort {
  readCareClosure(closureId: string): Promise<CareClosure>;
  retryCareClosure(
    closureId: string,
    request: { reason: string; expectedVersion: number },
  ): Promise<CareClosure>;
}

export interface CareClosureAccess {
  readonly role: ClinicalRole | null;
  readonly clinicalReadAuthorized: boolean;
  readonly clinicalWriteAuthorized: boolean;
}

/** HU-XCT-001: shows actual downstream outcomes and resumes failed closures. */
export class CareClosureTracking {
  constructor(private readonly port: CareClosurePort) {}

  async read(
    access: CareClosureAccess,
    closureId: string,
  ): Promise<CareClosure> {
    if (
      resolveClinicalAccess(access.role, access.clinicalReadAuthorized) !==
      'granted'
    )
      throw { code: 'FORBIDDEN' };
    return this.port.readCareClosure(closureId);
  }

  async retry(
    access: CareClosureAccess,
    closure: CareClosure,
    reason: string,
  ): Promise<CareClosure> {
    if (
      resolveClinicalWriteAccess(
        access.role,
        access.clinicalWriteAuthorized,
      ) !== 'granted'
    )
      throw { code: 'FORBIDDEN' };
    if (closure.status === 'CLOSURE_COMPLETED')
      throw { code: 'INVALID', message: 'El cierre ya está completado.' };
    if (!reason.trim() || reason.length > 1000)
      throw {
        code: 'INVALID',
        message: 'Indique el motivo del reintento (máximo 1000 caracteres).',
      };
    return this.port.retryCareClosure(closure.id, {
      reason,
      expectedVersion: closure.version,
    });
  }
}
