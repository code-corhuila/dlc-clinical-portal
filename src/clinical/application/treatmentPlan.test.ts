import { describe, expect, it, vi } from 'vitest';
import type { ClinicalRole } from '../model/clinicalAccess';
import type { Treatment } from '../model/treatment';
import { TreatmentPlan, type TreatmentPort } from './treatmentPlan';

const treatment: Treatment = {
  id: 'treatment-1',
  patientId: 'patient-1',
  clinicalReason: 'Dolor agudo',
  status: 'PLANNED',
  procedures: [
    {
      id: 'procedure-1',
      procedureCode: 'D1110',
      appointmentId: 'appointment-1',
      status: 'PLANNED',
    },
  ],
  version: 1,
};

function port(): TreatmentPort {
  return { listTreatments: vi.fn().mockResolvedValue([treatment]) };
}

const access = (role: ClinicalRole | null, authorized: boolean) => ({
  patientId: 'patient-1',
  role,
  clinicalAuthorized: authorized,
});

describe('TreatmentPlan', () => {
  it.each<ClinicalRole>(['DENTIST', 'ADMINISTRATOR'])(
    'lists treatments for an authorized %s',
    async (role) => {
      const treatments = port();

      await expect(
        new TreatmentPlan(treatments).list(access(role, true)),
      ).resolves.toEqual([treatment]);
      expect(treatments.listTreatments).toHaveBeenCalledWith('patient-1');
    },
  );

  it.each<[string, ClinicalRole | null, boolean]>([
    ['a secretary assistant', 'SECRETARY_ASSISTANT', true],
    ['an unauthorized administrator', 'ADMINISTRATOR', false],
    ['a missing role', null, true],
  ])('denies %s before calling the port', async (_, role, authorized) => {
    const treatments = port();

    await expect(
      new TreatmentPlan(treatments).list(access(role, authorized)),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(treatments.listTreatments).not.toHaveBeenCalled();
  });
});
