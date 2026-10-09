/** Patients-owned `PatientForCare` projection: the minimum a Dentist may see. */
export interface PatientForCare {
  readonly id: string;
  readonly name: string;
  readonly phone?: string;
  readonly email?: string;
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly version: number;
}
