import { describe, expect, it, vi } from 'vitest';
import type { ClinicalRole } from '../model/clinicalAccess';
import type { PatientForCare } from '../model/patientForCare';
import {
  ReadPatientForCare,
  type PatientForCarePort,
} from './readPatientForCare';

const patient: PatientForCare = {
  id: 'patient-1',
  name: 'Paciente sintético',
  phone: '+57 300 000 0000',
  status: 'ACTIVE',
  version: 1,
};

function port(): PatientForCarePort {
  return { readPatient: vi.fn().mockResolvedValue(patient) };
}

describe('ReadPatientForCare', () => {
  it.each<ClinicalRole>(['DENTIST', 'ADMINISTRATOR'])(
    'reads the care projection for an authorized %s',
    async (role) => {
      const patients = port();

      await expect(
        new ReadPatientForCare(patients).execute('patient-1', role, true),
      ).resolves.toEqual(patient);
      expect(patients.readPatient).toHaveBeenCalledWith('patient-1');
    },
  );

  it.each<[string, ClinicalRole | null, boolean]>([
    ['a secretary assistant', 'SECRETARY_ASSISTANT', true],
    ['a dentist without clinical read authorization', 'DENTIST', false],
    ['a missing role', null, true],
  ])('rejects %s before calling the port', async (_, role, authorized) => {
    const patients = port();

    await expect(
      new ReadPatientForCare(patients).execute('patient-1', role, authorized),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(patients.readPatient).not.toHaveBeenCalled();
  });
});
