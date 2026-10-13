import { describe, expect, it, vi } from 'vitest';
import { ListCarePatients, type CarePatientsPort } from './listCarePatients';

const patient = {
  id: 'p-1',
  name: 'Ana García',
  status: 'ACTIVE' as const,
  version: 1,
};

function port(): CarePatientsPort {
  return { listCarePatients: vi.fn().mockResolvedValue([patient]) };
}

describe('ListCarePatients', () => {
  it('lists the patients in clinical care for an authorized reader', async () => {
    const patients = port();

    await expect(
      new ListCarePatients(patients).execute('DENTIST', true),
    ).resolves.toEqual([patient]);
  });

  it.each([
    ['a secretary assistant', 'SECRETARY_ASSISTANT', true],
    ['an administrator without clinical read access', 'ADMINISTRATOR', false],
  ] as const)('denies %s before calling the port', async (_, role, read) => {
    const patients = port();

    await expect(
      new ListCarePatients(patients).execute(role, read),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(patients.listCarePatients).not.toHaveBeenCalled();
  });
});
