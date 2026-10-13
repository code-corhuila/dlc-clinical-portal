import { describe, expect, it, vi } from 'vitest';
import type { ClinicalRole } from '../model/clinicalAccess';
import type { ExtraItemDraft } from '../model/procedureCompletion';
import {
  CompleteProcedure,
  type ProcedureCompletionPort,
} from './completeProcedure';

const closure = {
  id: 'closure-1',
  procedureId: 'procedure-1',
  appointmentId: 'appointment-1',
  status: 'CLOSURE_PENDING',
  version: 1,
} as const;

function port(): ProcedureCompletionPort {
  return { completeProcedure: vi.fn().mockResolvedValue(closure) };
}

const access = (role: ClinicalRole | null, authorized: boolean) => ({
  role,
  clinicalWriteAuthorized: authorized,
  idempotencyKey: 'intent-1',
});

const material: ExtraItemDraft = {
  category: 'MATERIAL',
  type: 'ADDITIONAL_MATERIAL',
  code: 'MAT-01',
  quantity: '1.5',
  description: 'Resina adicional',
  clinicalReason: 'Cavidad más profunda de lo previsto',
};

const need: ExtraItemDraft = {
  category: 'REQUIREMENT',
  type: 'COMPLEXITY_ADJUSTMENT',
  quantity: '1',
  description: 'Anestesia adicional',
  clinicalReason: 'Sensibilidad persistente',
};

const target = { procedureId: 'procedure-1', treatmentVersion: 3 };

describe('CompleteProcedure', () => {
  it('completes a procedure with traceable extras and no money', async () => {
    const completions = port();
    const ids = ['source-1', 'source-2'];
    const useCase = new CompleteProcedure(completions, () => ids.shift()!);

    await expect(
      useCase.execute(access('DENTIST', true), target, [material, need]),
    ).resolves.toEqual({
      closure,
      extras: [
        expect.objectContaining({
          sourceRecordId: 'source-1',
          description: 'Resina adicional',
        }),
        expect.objectContaining({
          sourceRecordId: 'source-2',
          description: 'Anestesia adicional',
        }),
      ],
    });

    expect(completions.completeProcedure).toHaveBeenCalledWith(
      'procedure-1',
      {
        expectedVersion: 3,
        materialsUsed: [
          {
            sourceRecordId: 'source-1',
            type: 'ADDITIONAL_MATERIAL',
            code: 'MAT-01',
            quantity: '1.5',
            description: 'Resina adicional',
            clinicalReason: 'Cavidad más profunda de lo previsto',
          },
        ],
        additionalRequirements: [
          {
            sourceRecordId: 'source-2',
            type: 'COMPLEXITY_ADJUSTMENT',
            quantity: '1',
            description: 'Anestesia adicional',
            clinicalReason: 'Sensibilidad persistente',
          },
        ],
      },
      'intent-1',
    );
    const payload = JSON.stringify(
      vi.mocked(completions.completeProcedure).mock.calls[0],
    );
    expect(payload).not.toMatch(/price|amount|cost|currency/i);
  });

  it('completes a procedure without extras', async () => {
    const completions = port();

    await new CompleteProcedure(completions, () => 'id').execute(
      access('ADMINISTRATOR', true),
      target,
      [],
    );

    expect(completions.completeProcedure).toHaveBeenCalledWith(
      'procedure-1',
      {
        expectedVersion: 3,
        materialsUsed: [],
        additionalRequirements: [],
      },
      'intent-1',
    );
  });

  it.each<[string, ClinicalRole | null, boolean]>([
    ['a secretary assistant', 'SECRETARY_ASSISTANT', true],
    [
      'an administrator without clinical write authorization',
      'ADMINISTRATOR',
      false,
    ],
  ])('denies %s', async (_, role, authorized) => {
    const completions = port();

    await expect(
      new CompleteProcedure(completions, () => 'id').execute(
        access(role, authorized),
        target,
        [material],
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(completions.completeProcedure).not.toHaveBeenCalled();
  });

  it.each([
    ['a zero quantity', { ...material, quantity: '0' }],
    ['a negative quantity', { ...material, quantity: '-1' }],
    ['more than four decimals', { ...material, quantity: '1.23456' }],
    ['a missing clinical reason', { ...material, clinicalReason: ' ' }],
    ['a missing description', { ...material, description: '' }],
  ])('rejects an extra with %s', async (_, invalid) => {
    const completions = port();

    await expect(
      new CompleteProcedure(completions, () => 'id').execute(
        access('DENTIST', true),
        target,
        [invalid],
      ),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(completions.completeProcedure).not.toHaveBeenCalled();
  });

  it('forwards the intent Idempotency-Key with the completion', async () => {
    const completions = port();

    await new CompleteProcedure(completions, () => 'id').execute(
      { ...access('DENTIST', true), idempotencyKey: 'intent-done' },
      { procedureId: 'procedure-1', treatmentVersion: 3 },
      [],
    );

    expect(completions.completeProcedure).toHaveBeenCalledWith(
      'procedure-1',
      expect.objectContaining({ expectedVersion: 3 }),
      'intent-done',
    );
  });

  it('rejects a completion without an Idempotency-Key', async () => {
    const completions = port();

    await expect(
      new CompleteProcedure(completions, () => 'id').execute(
        { ...access('DENTIST', true), idempotencyKey: '' },
        { procedureId: 'procedure-1', treatmentVersion: 3 },
        [],
      ),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(completions.completeProcedure).not.toHaveBeenCalled();
  });
});
