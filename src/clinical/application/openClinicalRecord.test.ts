import { describe, expect, it, vi } from 'vitest';
import { OpenClinicalRecord } from './openClinicalRecord';

const context = {
  patientId: 'patient-1',
  role: 'DENTIST' as const,
  clinicalWriteAuthorized: true,
  idempotencyKey: 'key-1',
};

describe('OpenClinicalRecord (HU-CLN-001)', () => {
  it('opens the record of the patient for an authorized writer', async () => {
    const port = { openRecord: vi.fn(async () => undefined) };

    await new OpenClinicalRecord(port).execute(context);

    expect(port.openRecord).toHaveBeenCalledWith('patient-1', 'key-1');
  });

  it('never calls the owner without clinical write access or a key', async () => {
    const port = { openRecord: vi.fn(async () => undefined) };
    const opener = new OpenClinicalRecord(port);

    for (const denied of [
      { ...context, role: 'SECRETARY_ASSISTANT' as const },
      {
        ...context,
        role: 'ADMINISTRATOR' as const,
        clinicalWriteAuthorized: false,
      },
    ])
      await expect(opener.execute(denied)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    await expect(
      opener.execute({ ...context, idempotencyKey: '' }),
    ).rejects.toMatchObject({
      code: 'INVALID',
    });
    expect(port.openRecord).not.toHaveBeenCalled();
  });
});
