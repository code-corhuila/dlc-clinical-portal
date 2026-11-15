import {
  resolveClinicalAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';
import type { PatientForCare } from '../model/patientForCare';

/** A patient in care; `hasRecord: false` means the record is still to be opened. */
export interface CarePatient extends PatientForCare {
  readonly hasRecord?: boolean;
}

/** Patients in care the reader may open; no HTTP details. */
export interface CarePatientsPort {
  listCarePatients(): Promise<readonly CarePatient[]>;
}

/**
 * Clinical home: the care projection of each patient with a clinical record or
 * on the reader's agenda. The owners filter assignment; administrative search
 * stays in Patients.
 */
export class ListCarePatients {
  constructor(private readonly port: CarePatientsPort) {}

  async execute(
    role: ClinicalRole | null,
    clinicalReadAuthorized: boolean,
  ): Promise<readonly CarePatient[]> {
    if (resolveClinicalAccess(role, clinicalReadAuthorized) !== 'granted')
      throw { code: 'FORBIDDEN' };
    return this.port.listCarePatients();
  }
}
