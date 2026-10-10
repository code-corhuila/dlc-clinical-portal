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
          : { data: [{ id: 'r-1', patientId: 'p-1', version: 1 }], meta: {} },
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

  it('keeps the synthetic adapter out of the real composition source', () => {
    const source = readFileSync(
      'src/clinical/composition/realComposition.tsx',
      'utf8',
    );
    expect(source).not.toMatch(/demo/i);
  });
});
