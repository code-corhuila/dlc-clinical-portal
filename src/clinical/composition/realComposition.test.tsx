import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortalHttp } from '../adapter/out/http/portalHttp';
import { ClinicalPortalComposition } from './ClinicalPortalComposition';

afterEach(() => vi.unstubAllEnvs());

describe('real build composition (composition contract v1, C06)', () => {
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

  it('keeps the synthetic adapter out of the real composition source', () => {
    const source = readFileSync(
      'src/clinical/composition/realComposition.tsx',
      'utf8',
    );
    expect(source).not.toMatch(/demo/i);
  });
});
