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
  return {
    listTreatments: vi.fn().mockResolvedValue([treatment]),
    planTreatment: vi.fn().mockResolvedValue(treatment),
    startTreatment: vi.fn().mockResolvedValue(treatment),
  };
}

const access = (role: ClinicalRole | null, authorized: boolean) => ({
  patientId: 'patient-1',
  role,
  clinicalAuthorized: authorized,
});

const plan = {
  clinicalReason: 'Dolor agudo',
  procedures: [{ procedureCode: 'D1110', appointmentId: 'appointment-1' }],
};

describe('TreatmentPlan start', () => {
  it('starts a planned treatment with its expected version', async () => {
    const treatments = port();

    await new TreatmentPlan(treatments).start(
      access('DENTIST', true),
      treatment,
    );

    expect(treatments.startTreatment).toHaveBeenCalledWith('treatment-1', 1);
  });

  it.each<[string, ClinicalRole | null, boolean]>([
    ['a secretary assistant', 'SECRETARY_ASSISTANT', true],
    ['a dentist without write authorization', 'DENTIST', false],
  ])('denies %s starting a treatment', async (_, role, authorized) => {
    const treatments = port();

    await expect(
      new TreatmentPlan(treatments).start(access(role, authorized), treatment),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(treatments.startTreatment).not.toHaveBeenCalled();
  });

  it('only starts PLANNED treatments', async () => {
    const treatments = port();

    await expect(
      new TreatmentPlan(treatments).start(access('DENTIST', true), {
        ...treatment,
        status: 'IN_PROGRESS',
      }),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(treatments.startTreatment).not.toHaveBeenCalled();
  });
});

describe('TreatmentPlan planning', () => {
  it('plans a treatment for the patient without monetary fields', async () => {
    const treatments = port();

    await new TreatmentPlan(treatments).plan(access('DENTIST', true), plan);

    expect(treatments.planTreatment).toHaveBeenCalledWith({
      patientId: 'patient-1',
      ...plan,
    });
  });

  it('accepts a diagnosis instead of a clinical reason', async () => {
    const treatments = port();
    const byDiagnosis = {
      diagnosisId: 'diagnosis-1',
      procedures: plan.procedures,
    };

    await new TreatmentPlan(treatments).plan(
      access('DENTIST', true),
      byDiagnosis,
    );

    expect(treatments.planTreatment).toHaveBeenCalledWith({
      patientId: 'patient-1',
      ...byDiagnosis,
    });
  });

  it.each<[string, ClinicalRole | null, boolean]>([
    ['a secretary assistant', 'SECRETARY_ASSISTANT', true],
    ['an administrator without write authorization', 'ADMINISTRATOR', false],
  ])('denies %s planning', async (_, role, authorized) => {
    const treatments = port();

    await expect(
      new TreatmentPlan(treatments).plan(access(role, authorized), plan),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(treatments.planTreatment).not.toHaveBeenCalled();
  });

  it.each([
    ['without diagnosis or clinical reason', { ...plan, clinicalReason: ' ' }],
    ['without procedures', { ...plan, procedures: [] }],
    [
      'with an empty procedure code',
      {
        ...plan,
        procedures: [{ procedureCode: '', appointmentId: 'appointment-1' }],
      },
    ],
    [
      'without an appointment',
      { ...plan, procedures: [{ procedureCode: 'D1110', appointmentId: '' }] },
    ],
  ])('rejects a plan %s', async (_, invalid) => {
    const treatments = port();

    await expect(
      new TreatmentPlan(treatments).plan(access('DENTIST', true), invalid),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(treatments.planTreatment).not.toHaveBeenCalled();
  });
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
