import { describe, expect, it, vi } from 'vitest';
import { createHttpClinicalAdapter } from './httpClinicalAdapter';
import type { PortalHttp } from './portalHttp';

const meta = { page: 1, limit: 20, total: 1, totalPages: 1 };
const ok = (data: unknown) => ({
  ok: true as const,
  status: 200,
  data,
  headers: {},
  correlationId: 'corr-1',
});

function fakeHttp(...results: unknown[]) {
  const request = vi.fn();
  results.forEach((result) => request.mockResolvedValueOnce(result));
  return { http: { request } as unknown as PortalHttp, request };
}

describe('httpClinicalAdapter reads (composition contract v1, C06)', () => {
  it('reads the patient for care from the Patients operation', async () => {
    const { http, request } = fakeHttp(
      ok({
        id: 'p-1',
        name: 'Ana García',
        phone: '+57 300',
        status: 'ACTIVE',
        version: 2,
        documentNumber: '123',
      }),
    );

    const patient = await createHttpClinicalAdapter(http).readPatient('p-1');

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/api/v1/patients/p-1' }),
    );
    expect(patient).toEqual({
      id: 'p-1',
      name: 'Ana García',
      phone: '+57 300',
      status: 'ACTIVE',
      version: 2,
    });
  });

  it('finds the record by patient and reads its entries page and version', async () => {
    const entry = {
      id: 'e-1',
      recordId: 'r-1',
      kind: 'EVOLUTION',
      text: 'Control',
      authorId: 'a-1',
      version: 1,
    };
    const { http, request } = fakeHttp(
      ok({ data: [{ id: 'r-1', patientId: 'p-1', version: 4 }], meta }),
      ok({ data: [entry], meta }),
      ok({ id: 'r-1', patientId: 'p-1', version: 4 }),
    );
    const adapter = createHttpClinicalAdapter(http);

    expect(await adapter.findRecordId('p-1')).toBe('r-1');
    expect(await adapter.readEntries('r-1')).toEqual({ data: [entry], meta });
    expect(await adapter.readRecordVersion('r-1')).toBe(4);
    expect(request.mock.calls.map(([call]) => [call.path, call.query])).toEqual(
      [
        ['/api/v1/clinical-records', { patientId: ['p-1'] }],
        ['/api/v1/clinical-records/r-1/entries', undefined],
        ['/api/v1/clinical-records/r-1', undefined],
      ],
    );
  });

  it('reports a missing record as not found', async () => {
    const { http } = fakeHttp(ok({ data: [], meta: { ...meta, total: 0 } }));

    await expect(
      createHttpClinicalAdapter(http).findRecordId('p-9'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('lists treatments, closures and Billing prices', async () => {
    const treatment = {
      id: 't-1',
      patientId: 'p-1',
      status: 'PLANNED',
      procedures: [],
      version: 1,
    };
    const closure = {
      id: 'c-1',
      procedureId: 'pr-1',
      appointmentId: 'ap-1',
      status: 'CLOSURE_PENDING',
      version: 1,
    };
    const price = {
      id: 'pp-1',
      procedureCode: 'D1110',
      name: 'Limpieza profunda',
      basePrice: '180000.00',
      currency: 'COP',
      status: 'ACTIVE',
      validFrom: '2026-01-01',
    };
    const { http, request } = fakeHttp(
      ok({ data: [treatment], meta }),
      ok(closure),
      ok({ data: [price], meta }),
    );
    const adapter = createHttpClinicalAdapter(http);

    expect(await adapter.listTreatments('p-1')).toEqual([treatment]);
    expect(await adapter.readCareClosure('c-1')).toEqual(closure);
    expect(await adapter.listProcedurePrices()).toEqual([
      {
        procedureCode: 'D1110',
        name: 'Limpieza profunda',
        basePrice: '180000.00',
        currency: 'COP',
        status: 'ACTIVE',
      },
    ]);
    expect(request.mock.calls.map(([call]) => call.path)).toEqual([
      '/api/v1/treatments',
      '/api/v1/care-closures/c-1',
      '/api/v1/procedure-prices',
    ]);
    expect(request.mock.calls[0][0].query).toEqual({ patientId: ['p-1'] });
  });

  it('maps an owner failure to a typed error with the central message and traceId', async () => {
    const { http } = fakeHttp({
      ok: false,
      status: 403,
      error: 'FORBIDDEN',
      message: 'Operación no permitida.',
      details: [],
      traceId: 'trace-9',
      correlationId: 'corr-9',
      kind: 'http',
      retryable: false,
    });

    await expect(
      createHttpClinicalAdapter(http).readPatient('p-1'),
    ).rejects.toEqual({
      code: 'FORBIDDEN',
      message: 'Operación no permitida.',
      details: [],
      traceId: 'trace-9',
    });
  });

  it('marks cancelled reads so obsolete results are ignored', async () => {
    const { http } = fakeHttp({
      ok: false,
      status: 0,
      error: 'CANCELLED',
      message: 'Cancelado',
      correlationId: 'corr-2',
      kind: 'cancelled',
      retryable: false,
    });

    await expect(
      createHttpClinicalAdapter(http).readEntries('r-1'),
    ).rejects.toMatchObject({ code: 'CANCELLED' });
  });

  it('reports the dashboard as unavailable: no Gateway operation exists yet', async () => {
    const { http, request } = fakeHttp();

    await expect(
      createHttpClinicalAdapter(http).readDashboard({ scope: 'CLINIC' }),
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    expect(request).not.toHaveBeenCalled();
  });
});
