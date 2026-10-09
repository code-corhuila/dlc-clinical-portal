import { describe, expect, it, vi } from 'vitest';
import type { ClinicalRole } from '../model/clinicalAccess';
import {
  RecordClinicalEntry,
  type ClinicalEntryWritePort,
} from './recordClinicalEntry';

function writePort(): ClinicalEntryWritePort {
  return {
    findRecordId: vi.fn().mockResolvedValue('record-1'),
    appendEntry: vi.fn().mockResolvedValue(undefined),
  };
}

function context(role: ClinicalRole | null, clinicalWriteAuthorized: boolean) {
  return { patientId: 'patient-1', role, clinicalWriteAuthorized };
}

const consultation = { kind: 'CONSULTATION', text: 'Consulta' } as const;

describe('RecordClinicalEntry', () => {
  it('resolves the record and appends an authorized consultation', async () => {
    const port = writePort();

    await new RecordClinicalEntry(port).execute(
      context('DENTIST', true),
      consultation,
    );

    expect(port.findRecordId).toHaveBeenCalledWith('patient-1');
    expect(port.appendEntry).toHaveBeenCalledWith('record-1', consultation);
  });

  it('appends an evolution for an explicitly write-authorized administrator', async () => {
    const port = writePort();
    const evolution = { kind: 'EVOLUTION', text: 'Seguimiento' } as const;

    await new RecordClinicalEntry(port).execute(
      context('ADMINISTRATOR', true),
      evolution,
    );

    expect(port.appendEntry).toHaveBeenCalledWith('record-1', evolution);
  });

  it.each([
    ['a dentist without write authorization', context('DENTIST', false)],
    [
      'an administrator without write authorization',
      context('ADMINISTRATOR', false),
    ],
    ['a secretary assistant', context('SECRETARY_ASSISTANT', true)],
    ['a missing role', context(null, true)],
  ])('rejects %s before calling the port', async (_, writeContext) => {
    const port = writePort();

    await expect(
      new RecordClinicalEntry(port).execute(writeContext, consultation),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(port.findRecordId).not.toHaveBeenCalled();
    expect(port.appendEntry).not.toHaveBeenCalled();
  });

  it('rejects an empty narrative before calling the port', async () => {
    const port = writePort();

    await expect(
      new RecordClinicalEntry(port).execute(context('DENTIST', true), {
        kind: 'CONSULTATION',
        text: '   ',
      }),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(port.findRecordId).not.toHaveBeenCalled();
  });

  it('rejects entry kinds outside this increment', async () => {
    const port = writePort();
    const diagnosis = { kind: 'DIAGNOSIS', text: 'Sin consulta' } as never;

    await expect(
      new RecordClinicalEntry(port).execute(
        context('DENTIST', true),
        diagnosis,
      ),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(port.appendEntry).not.toHaveBeenCalled();
  });

  it('does not append when the record boundary denies the patient', async () => {
    const port = writePort();
    vi.mocked(port.findRecordId).mockRejectedValue({ code: 'FORBIDDEN' });

    await expect(
      new RecordClinicalEntry(port).execute(
        context('DENTIST', true),
        consultation,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(port.appendEntry).not.toHaveBeenCalled();
  });
});
