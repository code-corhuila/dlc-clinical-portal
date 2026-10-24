import { readFileSync } from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortalHttp } from '../adapter/out/http/portalHttp';
import { ClinicalPortalComposition } from './ClinicalPortalComposition';

afterEach(() => vi.unstubAllEnvs());

describe('real build composition (composition contract v1, C06)', () => {
  it('gives a secretary assistant no clinical reading or writing controls', async () => {
    vi.stubEnv('VITE_CLINICAL_DEMO', 'false');
    const request = vi.fn(async ({ path }: { path: string }) => ({
      ok: true,
      status: 200,
      correlationId: 'corr',
      data: path.endsWith('/patients/p-1')
        ? { id: 'p-1', name: 'Paciente Real', status: 'ACTIVE', version: 1 }
        : { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    }));

    render(
      <ClinicalPortalComposition
        patientId="p-1"
        role="SECRETARY_ASSISTANT"
        http={{ request } as unknown as PortalHttp}
      />,
    );

    expect(await screen.findByText(/Acceso denegado/)).toBeInTheDocument();
    for (const name of [
      'Nueva entrada',
      'Planificar nuevo tratamiento',
      'Declarar atención completada',
    ])
      expect(screen.queryByRole('button', { name })).toBeNull();
    // PAT-003: the assistant never requests clinical narrative.
    expect(request).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringContaining('/entries') }),
    );
  });

  it('reads the clinical record through the compositor http capability', async () => {
    vi.stubEnv('VITE_CLINICAL_DEMO', 'false');
    const request = vi.fn(async ({ path }: { path: string }) => ({
      ok: true,
      status: 200,
      correlationId: 'corr',
      data: path.endsWith('/patients/p-1')
        ? { id: 'p-1', name: 'Paciente Real', status: 'ACTIVE', version: 1 }
        : path.endsWith('/entries')
          ? { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }
          : path.endsWith('/clinical-records')
            ? { data: [{ id: 'r-1', patientId: 'p-1', version: 1 }], meta: {} }
            : { data: [], meta: {} },
    }));

    render(
      <ClinicalPortalComposition
        patientId="p-1"
        role="DENTIST"
        http={{ request } as unknown as PortalHttp}
      />,
    );

    expect(await screen.findByText('Paciente Real')).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/patients/p-1' }),
    );
  });

  it('labels consultations for the declaration with the clinic day', async () => {
    vi.stubEnv('VITE_CLINICAL_DEMO', 'false');
    const page = (data: unknown[]) => ({
      data,
      meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
    });
    const routes: Record<string, unknown> = {
      '/api/v1/patients/p-1': {
        id: 'p-1',
        name: 'Paciente Real',
        status: 'ACTIVE',
        version: 1,
      },
      '/api/v1/clinical-records': page([
        { id: 'r-1', patientId: 'p-1', version: 1 },
      ]),
      '/api/v1/clinical-records/r-1/entries': page([
        {
          id: 'c-1',
          recordId: 'r-1',
          kind: 'CONSULTATION',
          text: 'Dolor en 36',
          authorId: 'a-1',
          createdAt: '2026-10-24T03:50:00Z',
          updatedAt: '2026-10-24T03:50:00Z',
          version: 1,
        },
      ]),
      '/api/v1/treatments': page([]),
    };
    const request = vi.fn(async ({ path }: { path: string }) => ({
      ok: true,
      status: 200,
      correlationId: 'corr',
      data: routes[path] ?? page([]),
    }));

    render(
      <ClinicalPortalComposition
        patientId="p-1"
        role="DENTIST"
        http={{ request } as unknown as PortalHttp}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Declarar atención completada',
      }),
    );
    expect(
      await screen.findByRole('option', { name: /Dolor en 36/ }),
    ).toHaveTextContent('2026-10-23 · Dolor en 36');
  });

  it('wires treatments, Billing estimate and writes in the real build', async () => {
    vi.stubEnv('VITE_CLINICAL_DEMO', 'false');
    const page = (data: unknown[]) => ({
      data,
      meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
    });
    const routes: Record<string, unknown> = {
      '/api/v1/patients/p-1': {
        id: 'p-1',
        name: 'Paciente Real',
        status: 'ACTIVE',
        version: 1,
      },
      '/api/v1/clinical-records': page([
        { id: 'r-1', patientId: 'p-1', version: 1 },
      ]),
      '/api/v1/clinical-records/r-1/entries': page([]),
      '/api/v1/treatments': page([
        {
          id: 't-1',
          patientId: 'p-1',
          clinicalReason: 'Control',
          status: 'PLANNED',
          procedures: [
            {
              id: 'pr-1',
              procedureCode: 'D1110',
              appointmentId: 'ap-1',
              status: 'PLANNED',
            },
          ],
          version: 1,
        },
      ]),
      '/api/v1/procedure-prices': page([
        {
          id: 'x',
          procedureCode: 'D1110',
          name: 'Limpieza profunda',
          basePrice: '180000.00',
          currency: 'COP',
          status: 'ACTIVE',
        },
      ]),
    };
    const request = vi.fn(async ({ path }: { path: string }) => ({
      ok: true,
      status: 200,
      correlationId: 'corr',
      data: routes[path],
    }));

    render(
      <ClinicalPortalComposition
        patientId="p-1"
        role="DENTIST"
        http={{ request } as unknown as PortalHttp}
      />,
    );

    expect(
      await screen.findByRole('cell', { name: /^Limpieza profunda/ }),
    ).toBeInTheDocument();
    expect((await screen.findAllByText(/180.000,00/)).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Nueva entrada' }),
    ).toBeInTheDocument();
  });

  it('plans procedures for the appointment in care read from Appointments', async () => {
    vi.stubEnv('VITE_CLINICAL_DEMO', 'false');
    const page = (data: unknown[]) => ({
      data,
      meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
    });
    const routes: Record<string, unknown> = {
      '/api/v1/patients/p-1': {
        id: 'p-1',
        name: 'Paciente Real',
        status: 'ACTIVE',
        version: 1,
      },
      '/api/v1/clinical-records': page([
        { id: 'r-1', patientId: 'p-1', version: 1 },
      ]),
      '/api/v1/clinical-records/r-1/entries': page([]),
      '/api/v1/treatments': page([]),
      '/api/v1/appointments': page([
        { id: 'ap-9', patientId: 'p-1', status: 'EN_ATENCION' },
      ]),
      '/api/v1/procedure-prices': page([
        {
          id: 'x',
          procedureCode: 'D1110',
          name: 'Limpieza profunda',
          basePrice: '180000.00',
          currency: 'COP',
          status: 'ACTIVE',
        },
      ]),
    };
    const request = vi.fn(
      async ({ method, path }: { method: string; path: string }) => ({
        ok: true,
        status: method === 'POST' ? 201 : 200,
        correlationId: 'corr',
        data:
          method === 'POST'
            ? {
                id: 't-1',
                patientId: 'p-1',
                clinicalReason: 'Control',
                status: 'PLANNED',
                procedures: [],
                version: 1,
              }
            : routes[path],
      }),
    );

    render(
      <ClinicalPortalComposition
        patientId="p-1"
        role="DENTIST"
        http={{ request } as unknown as PortalHttp}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Planificar nuevo tratamiento',
      }),
    );
    fireEvent.change(screen.getByLabelText('Motivo clínico'), {
      target: { value: 'Control' },
    });
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'Limpieza profunda' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Planificar tratamiento' }),
    );

    await vi.waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: '/api/v1/treatments',
          body: expect.objectContaining({
            procedures: [{ procedureCode: 'D1110', appointmentId: 'ap-9' }],
          }),
        }),
      ),
    );
  });

  it('keeps the synthetic adapter out of the real composition source', () => {
    const source = readFileSync(
      'src/clinical/composition/realComposition.tsx',
      'utf8',
    );
    expect(source).not.toMatch(/demo/i);
  });
});
