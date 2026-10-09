import { describe, expect, it, vi } from 'vitest';
import type { ClinicalRole } from '../model/clinicalAccess';
import {
  AmendClinicalEntry,
  type ClinicalEntryAmendPort,
} from './amendClinicalEntry';

function port(): ClinicalEntryAmendPort {
  return { amendEntry: vi.fn().mockResolvedValue(undefined) };
}

const access = (role: ClinicalRole | null, authorized: boolean) => ({
  role,
  clinicalWriteAuthorized: authorized,
});

const entry = { id: 'entry-1', version: 2 };
const correction = { text: 'Texto corregido', reason: 'Error de pieza' };

describe('AmendClinicalEntry', () => {
  it('amends an entry with reason and expected version', async () => {
    const amendments = port();

    await new AmendClinicalEntry(amendments).execute(
      access('DENTIST', true),
      entry,
      correction,
    );

    expect(amendments.amendEntry).toHaveBeenCalledWith('entry-1', {
      ...correction,
      expectedVersion: 2,
    });
  });

  it.each<[string, ClinicalRole | null, boolean]>([
    ['a secretary assistant', 'SECRETARY_ASSISTANT', true],
    ['an administrator without write authorization', 'ADMINISTRATOR', false],
  ])('denies %s', async (_, role, authorized) => {
    const amendments = port();

    await expect(
      new AmendClinicalEntry(amendments).execute(
        access(role, authorized),
        entry,
        correction,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(amendments.amendEntry).not.toHaveBeenCalled();
  });

  it.each([
    ['an empty text', { ...correction, text: ' ' }],
    ['an empty reason', { ...correction, reason: '' }],
    [
      'a reason over 1000 characters',
      { ...correction, reason: 'x'.repeat(1001) },
    ],
  ])('rejects %s before calling the port', async (_, invalid) => {
    const amendments = port();

    await expect(
      new AmendClinicalEntry(amendments).execute(
        access('DENTIST', true),
        entry,
        invalid,
      ),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(amendments.amendEntry).not.toHaveBeenCalled();
  });
});
