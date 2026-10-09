import {
  resolveClinicalAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';
import type { Treatment } from '../model/treatment';

/** Host-provided treatments boundary; it deliberately contains no HTTP details. */
export interface TreatmentPort {
  listTreatments(patientId: string): Promise<readonly Treatment[]>;
}

export interface TreatmentAccess {
  readonly patientId: string;
  readonly role: ClinicalRole | null;
  readonly clinicalAuthorized: boolean;
}

/** Reads the patient's treatment plan for an authorized clinical reader. */
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
}
