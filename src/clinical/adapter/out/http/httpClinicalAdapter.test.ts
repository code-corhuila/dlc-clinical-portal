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
    expect(await adapter.readEntries('r-1')).toEqual({
      data: [entry],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    expect(await adapter.readRecordVersion('r-1')).toBe(4);
    expect(request.mock.calls.map(([call]) => [call.path, call.query])).toEqual(
      [
        ['/api/v1/clinical-records', { patientId: ['p-1'] }],
        [
          '/api/v1/clinical-records/r-1/entries',
          { page: ['1'], limit: ['100'] },
        ],
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
    expect(request.mock.calls[0][0].query).toEqual({
      patientId: ['p-1'],
      page: ['1'],
      limit: ['100'],
    });
  });

  it('reads the in-care appointment of the patient from Appointments', async () => {
    const { http, request } = fakeHttp(
      ok({
        data: [
          { id: 'ap-1', patientId: 'p-1', status: 'FINALIZADA' },
          { id: 'ap-2', patientId: 'p-1', status: 'EN_ATENCION' },
        ],
        meta,
      }),
      ok({ data: [], meta: { ...meta, total: 0 } }),
    );
    const adapter = createHttpClinicalAdapter(http);

    expect(await adapter.readInCareAppointment('p-1')).toBe('ap-2');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/api/v1/appointments',
        query: expect.objectContaining({ patientId: ['p-1'], limit: ['100'] }),
      }),
    );
    // Only the window around now: an appointment in care started recently.
    const { from, to } = request.mock.calls[0][0].query;
    expect(Date.parse(to[0]) - Date.parse(from[0])).toBe(2 * 864e5);
    expect(Math.abs(Date.parse(from[0]) + 864e5 - Date.now())).toBeLessThan(
      60e3,
    );
    // No appointment in care: planning and declaring stay blocked.
    expect(await adapter.readInCareAppointment('p-1')).toBeUndefined();
  });

  // Owners page every list (default 20, at most 100, _shared.yaml): a longitudinal
  // history, a dentist's patients or the price catalogue must not stop at page one.
  it('reads every page of the owner lists', async () => {
    const total = 230;
    const request = vi.fn(
      async ({
        path,
        query,
      }: {
        path: string;
        query?: Record<string, string[]>;
      }) => {
        if (path.startsWith('/api/v1/patients/'))
          return ok({
            id: path.split('/').pop(),
            name: 'P',
            status: 'ACTIVE',
            version: 1,
          });
        const page = Number(query?.page?.[0] ?? '1');
        const limit = Number(query?.limit?.[0] ?? '20');
        const from = (page - 1) * limit;
        const data = Array.from(
          { length: Math.max(0, Math.min(limit, total - from)) },
          (_, i) => ({
            id: `x-${from + i}`,
            patientId: `p-${from + i}`,
            procedureCode: `C-${from + i}`,
            name: 'n',
            basePrice: '1.00',
            currency: 'COP',
            status: 'ACTIVE',
          }),
        );
        return ok({
          data,
          meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
      },
    );
    const adapter = createHttpClinicalAdapter({
      request,
    } as unknown as PortalHttp);

    expect((await adapter.readEntries('r-1')).data).toHaveLength(total);
    expect(await adapter.listTreatments('p-1')).toHaveLength(total);
    expect(await adapter.listProcedurePrices()).toHaveLength(total);
    expect(await adapter.listCarePatients()).toHaveLength(total);
    const listCalls = request.mock.calls
      .map(([call]) => call)
      .filter((call) => !call.path.startsWith('/api/v1/patients/'));
    expect(listCalls.every((call) => call.query?.limit?.[0] === '100')).toBe(
      true,
    );
    expect(listCalls).toHaveLength(4 * 3);
  });

  it('opens a clinical record with its intent key; an existing record is not a failure', async () => {
    const { http, request } = fakeHttp(
      ok({ id: 'r-1', patientId: 'p-1', version: 1 }),
      {
        ok: false,
        kind: 'http',
        status: 409,
        error: 'RECORD_ALREADY_EXISTS',
        message: 'exists',
        correlationId: 'corr-2',
      },
    );
    const adapter = createHttpClinicalAdapter(http);

    await adapter.openRecord('p-1', 'key-open-1');
    // Opened concurrently by another request: the record exists, which is the goal.
    await adapter.openRecord('p-1', 'key-open-2');

    expect(request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        method: 'POST',
        path: '/api/v1/clinical-records',
        body: { patientId: 'p-1' },
        headers: { 'Idempotency-Key': 'key-open-1' },
      }),
    );
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

  it('reads the role-scoped Clinical Analytics dashboard (HU-CLN-003)', async () => {
    const dashboard = {
      asOf: '2026-10-23T23:17:48Z',
      todayAppointments: { count: 1, deltaVsYesterday: 1 },
      weeklyActivity: [{ day: '2026-10-19', count: 0 }],
      monthlyRevenue: { amount: '150000.50' },
    };
    const { http, request } = fakeHttp(ok(dashboard));

    expect(
      await createHttpClinicalAdapter(http).readDashboard({ scope: 'CLINIC' }),
    ).toEqual(dashboard);
    // The service scopes by the token's role; the client sends no scope.
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/api/v1/clinical-analytics/dashboard',
      }),
    );
  });

  it('lists care patients from clinical records and the Patients projection', async () => {
    const { http, request } = fakeHttp(
      ok({ data: [{ id: 'r-1', patientId: 'p-1', version: 1 }], meta }),
      ok({ id: 'p-1', name: 'Ana García', status: 'ACTIVE', version: 3 }),
    );

    expect(await createHttpClinicalAdapter(http).listCarePatients()).toEqual([
      { id: 'p-1', name: 'Ana García', status: 'ACTIVE', version: 3 },
    ]);
    expect(request.mock.calls.map(([call]) => call.path)).toEqual([
      '/api/v1/clinical-records',
      '/api/v1/patients/p-1',
    ]);
  });
});
