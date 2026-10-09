import {
  resolveClinicalAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';
import type { PatientForCare } from '../model/patientForCare';

/** Host-provided boundary for the Patients read contract; no HTTP details. */
export interface PatientForCarePort {
  readPatient(patientId: string): Promise<PatientForCare>;
}

/** Reads the minimized patient identity shown in the clinical record header. */
export class ReadPatientForCare {
  constructor(private readonly port: PatientForCarePort) {}

  async execute(
    patientId: string,
    role: ClinicalRole | null,
    clinicalReadAuthorized: boolean,
  ): Promise<PatientForCare> {
    if (resolveClinicalAccess(role, clinicalReadAuthorized) !== 'granted')
      throw { code: 'FORBIDDEN' };
    return this.port.readPatient(patientId);
  }
}
