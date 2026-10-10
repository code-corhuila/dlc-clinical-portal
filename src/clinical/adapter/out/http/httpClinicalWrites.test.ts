import { describe, expect, it, vi } from 'vitest';
import { createHttpClinicalAdapter } from './httpClinicalAdapter';
import type { PortalHttp } from './portalHttp';

const done = (status: number, data: unknown) => ({
  ok: true as const,
  status,
  data,
  correlationId: 'corr',
});

function adapterReturning(result: unknown) {
  const request = vi.fn().mockResolvedValue(result);
  const http = { request } as unknown as PortalHttp;
  return { adapter: createHttpClinicalAdapter(http), request };
}

const closure = {
  id: 'c-1',
  procedureId: 'pr-1',
  appointmentId: 'ap-1',
  status: 'CLOSURE_PENDING',
  version: 2,
};
const treatment = {
  id: 't-1',
  patientId: 'p-1',
  status: 'IN_PROGRESS',
  procedures: [],
  version: 2,
};

describe('httpClinicalAdapter writes (C06, Idempotency-Key per intent)', () => {
  it.each([
    [
      'appends an entry',
      (a: ReturnType<typeof createHttpClinicalAdapter>) =>
        a.appendEntry('r-1', { kind: 'EVOLUTION', text: 'Control' }, 'k-1'),
      '/api/v1/clinical-records/r-1/entries',
      { kind: 'EVOLUTION', text: 'Control' },
      done(201, { id: 'e-9' }),
    ],
    [
      'amends an entry',
      (a: ReturnType<typeof createHttpClinicalAdapter>) =>
        a.amendEntry(
          'e-1',
          { text: 'Corregido', reason: 'Pieza', expectedVersion: 1 },
          'k-1',
        ),
      '/api/v1/clinical-entries/e-1/amendments',
      { text: 'Corregido', reason: 'Pieza', expectedVersion: 1 },
      done(201, { id: 'e-2' }),
    ],
    [
      'plans a treatment',
      (a: ReturnType<typeof createHttpClinicalAdapter>) =>
        a.planTreatment(
          {
            patientId: 'p-1',
            clinicalReason: 'Caries',
            procedures: [{ procedureCode: 'D2391', appointmentId: 'ap-1' }],
          },
          'k-1',
        ),
      '/api/v1/treatments',
      {
        patientId: 'p-1',
        clinicalReason: 'Caries',
        procedures: [{ procedureCode: 'D2391', appointmentId: 'ap-1' }],
      },
      done(201, treatment),
    ],
    [
      'starts a treatment',
      (a: ReturnType<typeof createHttpClinicalAdapter>) =>
        a.startTreatment('t-1', 1, 'k-1'),
      '/api/v1/treatments/t-1/starts',
      { expectedVersion: 1 },
      done(200, treatment),
    ],
    [
      'completes a procedure',
      (a: ReturnType<typeof createHttpClinicalAdapter>) =>
        a.completeProcedure(
          'pr-1',
          { expectedVersion: 2, materialsUsed: [], additionalRequirements: [] },
          'k-1',
        ),
      '/api/v1/procedures/pr-1/completions',
      { expectedVersion: 2, materialsUsed: [], additionalRequirements: [] },
      done(202, closure),
    ],
    [
      'declares the care completed',
      (a: ReturnType<typeof createHttpClinicalAdapter>) =>
        a.declareCareCompleted(
          'r-1',
          { consultationId: 'e-1', appointmentId: 'ap-1', expectedVersion: 4 },
          'k-1',
        ),
      '/api/v1/clinical-records/r-1/care-completions',
      { consultationId: 'e-1', appointmentId: 'ap-1', expectedVersion: 4 },
      done(201, { id: 'cc-1' }),
    ],
    [
      'retries a care closure',
      (a: ReturnType<typeof createHttpClinicalAdapter>) =>
        a.retryCareClosure(
          'c-1',
          { reason: 'Precio', expectedVersion: 2 },
          'k-1',
        ),
      '/api/v1/care-closures/c-1/retries',
      { reason: 'Precio', expectedVersion: 2 },
      done(202, closure),
    ],
  ])(
    '%s with POST, OpenAPI body and the intent key',
    async (_, call, path, body, result) => {
      const { adapter, request } = adapterReturning(result);

      await call(adapter);

      expect(request).toHaveBeenCalledOnce();
      expect(request).toHaveBeenCalledWith({
        method: 'POST',
        path,
        body,
        headers: { 'Idempotency-Key': 'k-1' },
      });
    },
  );

  it('returns the owner resources of treatment, closure and care-completion writes', async () => {
    const started = adapterReturning(done(200, treatment));
    expect(await started.adapter.startTreatment('t-1', 1, 'k')).toEqual(
      treatment,
    );
    const completed = adapterReturning(done(202, closure));
    expect(
      await completed.adapter.completeProcedure(
        'pr-1',
        { expectedVersion: 2, materialsUsed: [], additionalRequirements: [] },
        'k',
      ),
    ).toEqual(closure);
  });

  it('reports a write timeout as an unknown outcome and never retries by itself', async () => {
    const { adapter, request } = adapterReturning({
      ok: false,
      status: 0,
      error: 'TIMEOUT',
      message:
        'Servicio temporalmente no disponible; el resultado puede ser desconocido.',
      traceId: 'corr-t',
      correlationId: 'corr-t',
      kind: 'timeout',
      retryable: false,
    });

    await expect(
      adapter.appendEntry('r-1', { kind: 'EVOLUTION', text: 'x' }, 'k-1'),
    ).rejects.toMatchObject({ code: 'TIMEOUT', traceId: 'corr-t' });
    expect(request).toHaveBeenCalledOnce();
  });
});
