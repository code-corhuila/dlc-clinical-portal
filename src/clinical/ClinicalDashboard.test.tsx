import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClinicalDashboard } from './ClinicalDashboard';
import type { PortalHttp } from './adapter/out/http/portalHttp';
import { createInMemoryClinicalAdapter } from './test/inMemoryClinicalAdapter';

describe('ClinicalDashboard (federated entry for /app/dashboard)', () => {
  it('waits for the dlc-front session, without clinical data', () => {
    render(<ClinicalDashboard />);

    expect(
      screen.getByText(/shared session supplied by dlc-front/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/14\.500\.000/)).toBeNull();
  });

  it('uses the role and staff name supplied by the shell', async () => {
    const snapshot = await createInMemoryClinicalAdapter().readDashboard({
      scope: 'PROFESSIONAL',
      professionalId: 'staff-1',
    });
    const request = vi.fn(async () => ({
      ok: true,
      status: 200,
      correlationId: 'corr',
      data: snapshot,
    }));
    render(
      <ClinicalDashboard
        role="DENTIST"
        staffId="staff-1"
        staffName="Dra. Valentina Ruiz"
        http={{ request } as unknown as PortalHttp}
      />,
    );

    expect(
      await screen.findByText(/Bienvenida de nuevo, Dra. Valentina Ruiz/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Ingresos del mes' }),
    ).toBeNull();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/clinical-analytics/dashboard' }),
    );
  });
});
