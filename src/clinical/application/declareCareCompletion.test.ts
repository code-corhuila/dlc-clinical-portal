import { describe, expect, it, vi } from 'vitest';
import type { ClinicalRole } from '../model/clinicalAccess';
import {
  DeclareCareCompletion,
  type CareCompletionPort,
} from './declareCareCompletion';

const completion = {
  id: 'completion-1',
  clinicalRecordId: 'record-1',
  consultationId: 'consultation-1',
  appointmentId: 'appointment-1',
  patientId: 'patient-1',
  dentistId: 'dentist-1',
  procedureIds: ['procedure-1'],
  manualChargeIds: [],
  completedAt: '2026-10-09T10:00:00.000Z',
};

function port(): CareCompletionPort {
  return {
    findRecordId: vi.fn().mockResolvedValue('record-1'),
    readRecordVersion: vi.fn().mockResolvedValue(4),
    declareCareCompleted: vi.fn().mockResolvedValue(completion),
  };
}

const access = (role: ClinicalRole | null, authorized: boolean) => ({
  patientId: 'patient-1',
  role,
  clinicalWriteAuthorized: authorized,
  idempotencyKey: 'intent-1',
});

const declaration = {
  consultationId: 'consultation-1',
  appointmentId: 'appointment-1',
};

describe('DeclareCareCompletion', () => {
  it('declares the encounter complete with the current record version', async () => {
    const completions = port();

    await expect(
      new DeclareCareCompletion(completions).execute(
        access('DENTIST', true),
        declaration,
      ),
    ).resolves.toEqual(completion);
    expect(completions.declareCareCompleted).toHaveBeenCalledWith(
      'record-1',
      {
        ...declaration,
        expectedVersion: 4,
      },
      'intent-1',
    );
  });

  it.each<[string, ClinicalRole | null, boolean]>([
    [
      'an administrator, even with clinical write access',
      'ADMINISTRATOR',
      true,
    ],
    ['a secretary assistant', 'SECRETARY_ASSISTANT', true],
    ['a dentist without write authorization', 'DENTIST', false],
  ])('denies %s', async (_, role, authorized) => {
    const completions = port();

    await expect(
      new DeclareCareCompletion(completions).execute(
        access(role, authorized),
        declaration,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(completions.declareCareCompleted).not.toHaveBeenCalled();
  });

  it.each([
    [
      'without an explicit consultation',
      { ...declaration, consultationId: '' },
    ],
    ['without an appointment', { ...declaration, appointmentId: '' }],
  ])('rejects a declaration %s', async (_, invalid) => {
    const completions = port();

    await expect(
      new DeclareCareCompletion(completions).execute(
        access('DENTIST', true),
        invalid,
      ),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(completions.findRecordId).not.toHaveBeenCalled();
  });

  it('forwards the intent Idempotency-Key with the declaration', async () => {
    const completions = port();

    await new DeclareCareCompletion(completions).execute(
      { ...access('DENTIST', true), idempotencyKey: 'intent-7' },
      declaration,
    );

    expect(completions.declareCareCompleted).toHaveBeenCalledWith(
      'record-1',
      { ...declaration, expectedVersion: 4 },
      'intent-7',
    );
  });

  it('rejects a declaration without an Idempotency-Key', async () => {
    const completions = port();

    await expect(
      new DeclareCareCompletion(completions).execute(
        { ...access('DENTIST', true), idempotencyKey: '' },
        declaration,
      ),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(completions.declareCareCompleted).not.toHaveBeenCalled();
  });
});
