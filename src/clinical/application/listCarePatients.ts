import {
  resolveClinicalAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';
import type { PatientForCare } from '../model/patientForCare';

/** Patients with a clinical record the reader may open; no HTTP details. */
export interface CarePatientsPort {
  listCarePatients(): Promise<readonly PatientForCare[]>;
}

/**
 * Clinical home: the care projection of each patient with a clinical record.
 * The owner service filters assignment; administrative search stays in Patients.
 */
export class ListCarePatients {
  constructor(private readonly port: CarePatientsPort) {}

  async execute(
    role: ClinicalRole | null,
    clinicalReadAuthorized: boolean,
  ): Promise<readonly PatientForCare[]> {
    if (resolveClinicalAccess(role, clinicalReadAuthorized) !== 'granted')
      throw { code: 'FORBIDDEN' };
    return this.port.listCarePatients();
  }
}
