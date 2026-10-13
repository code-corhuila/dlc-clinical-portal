import { describe, expect, it, vi } from 'vitest';
import type { ClinicalRole } from '../model/clinicalAccess';
import type { CareClosure } from '../model/procedureCompletion';
import {
  CareClosureTracking,
  type CareClosurePort,
} from './careClosureTracking';

const failed: CareClosure = {
  id: 'closure-1',
  procedureId: 'procedure-1',
  appointmentId: 'appointment-1',
  status: 'CLOSURE_FAILED',
  appointmentOutcome: 'COMPLETED',
  billingOutcome: 'PENDING',
  failureReason: 'Precio manual pendiente',
  version: 2,
};

function port(): CareClosurePort {
  return {
    readCareClosure: vi.fn().mockResolvedValue(failed),
    retryCareClosure: vi
      .fn()
      .mockResolvedValue({ ...failed, status: 'CLOSURE_PENDING', version: 3 }),
  };
}

const access = (role: ClinicalRole | null, read: boolean, write: boolean) => ({
  role,
  clinicalReadAuthorized: read,
  clinicalWriteAuthorized: write,
  idempotencyKey: 'intent-1',
});

describe('CareClosureTracking', () => {
  it('reads the actual closure outcome for an authorized clinical reader', async () => {
    const closures = port();

    await expect(
      new CareClosureTracking(closures).read(
        access('ADMINISTRATOR', true, false),
        'closure-1',
      ),
    ).resolves.toEqual(failed);
  });

  it('denies a secretary assistant reading a closure', async () => {
    const closures = port();

    await expect(
      new CareClosureTracking(closures).read(
        access('SECRETARY_ASSISTANT', true, true),
        'closure-1',
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(closures.readCareClosure).not.toHaveBeenCalled();
  });

  it('retries a failed closure with a reason and its version', async () => {
    const closures = port();

    await new CareClosureTracking(closures).retry(
      access('DENTIST', true, true),
      failed,
      'Precio registrado en Facturación',
    );

    expect(closures.retryCareClosure).toHaveBeenCalledWith(
      'closure-1',
      {
        reason: 'Precio registrado en Facturación',
        expectedVersion: 2,
      },
      'intent-1',
    );
  });

  it('rejects a retry without write authorization', async () => {
    const closures = port();

    await expect(
      new CareClosureTracking(closures).retry(
        access('DENTIST', true, false),
        failed,
        'Motivo',
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(closures.retryCareClosure).not.toHaveBeenCalled();
  });

  it.each([
    ['without a reason', failed, ' '],
    [
      'for a completed closure',
      { ...failed, status: 'CLOSURE_COMPLETED' },
      'x',
    ],
  ] as const)('rejects a retry %s', async (_, closure, reason) => {
    const closures = port();

    await expect(
      new CareClosureTracking(closures).retry(
        access('DENTIST', true, true),
        closure,
        reason,
      ),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(closures.retryCareClosure).not.toHaveBeenCalled();
  });

  it('forwards the intent Idempotency-Key with the retry', async () => {
    const closures = port();

    await new CareClosureTracking(closures).retry(
      { ...access('DENTIST', true, true), idempotencyKey: 'intent-9' },
      failed,
      'Precio cargado',
    );

    expect(closures.retryCareClosure).toHaveBeenCalledWith(
      'closure-1',
      { reason: 'Precio cargado', expectedVersion: 2 },
      'intent-9',
    );
  });

  it('rejects a retry without an Idempotency-Key', async () => {
    const closures = port();

    await expect(
      new CareClosureTracking(closures).retry(
        { ...access('DENTIST', true, true), idempotencyKey: '' },
        failed,
        'Precio cargado',
      ),
    ).rejects.toMatchObject({ code: 'INVALID' });
    expect(closures.retryCareClosure).not.toHaveBeenCalled();
  });
});
