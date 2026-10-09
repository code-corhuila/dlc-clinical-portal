import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReadDashboard } from '../../../../application/readDashboard';
import { createDemoClinicalAdapter } from '../../../out/demo/demoClinicalAdapter';
import type { ClinicalRole } from '../../../../model/clinicalAccess';
import { ClinicalDashboardPage } from './ClinicalDashboardPage';

const now = () => new Date();

function renderDashboard(role: ClinicalRole, reader = demoReader()) {
  return render(
    <ClinicalDashboardPage
      reader={reader}
      role={role}
      staffId="demo-dentist"
      staffName="Dra. Valentina Ruiz"
    />,
  );
}

function demoReader() {
  return new ReadDashboard(createDemoClinicalAdapter(), now);
}

describe('ClinicalDashboardPage', () => {
  it('shows the administrator dashboard with revenue in COP', async () => {
    renderDashboard('ADMINISTRATOR');

    expect(
      await screen.findByRole('region', { name: 'Citas de hoy' }),
    ).toHaveTextContent('12');
    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument();
    expect(screen.getByText(/Bienvenida de nuevo/)).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Ingresos del mes' }),
    ).toHaveTextContent(/14\.500\.000,00/);
    expect(
      screen.getByRole('region', { name: 'Próximas citas' }),
    ).toHaveTextContent('María Jiménez');
  });

  it('narrows the dentist dashboard to own scope without revenue', async () => {
    renderDashboard('DENTIST');

    expect(
      await screen.findByRole('region', { name: 'Citas de hoy' }),
    ).toHaveTextContent('5');
    expect(
      screen.queryByRole('region', { name: 'Ingresos del mes' }),
    ).toBeNull();
  });

  it('hides revenue from the secretary assistant', async () => {
    renderDashboard('SECRETARY_ASSISTANT');

    expect(
      await screen.findByRole('region', { name: 'Pacientes pendientes' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Ingresos del mes' }),
    ).toBeNull();
  });

  it('warns that stale data is informative only', async () => {
    const adapter = createDemoClinicalAdapter();
    const snapshot = await adapter.readDashboard({ scope: 'CLINIC' });
    const reader = new ReadDashboard(
      {
        readDashboard: async () => ({
          ...snapshot,
          asOf: '2020-01-01T00:00:00.000Z',
        }),
      },
      now,
    );

    renderDashboard('ADMINISTRATOR', reader);

    expect(
      await screen.findByText(/Datos desactualizados/),
    ).toBeInTheDocument();
  });

  it('shows a safe error when the dashboard cannot load', async () => {
    const reader = new ReadDashboard(
      { readDashboard: vi.fn().mockRejectedValue(new Error('stack trace')) },
      now,
    );

    renderDashboard('ADMINISTRATOR', reader);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No fue posible cargar el panel.',
    );
  });

  it('does not keep the administrator revenue visible after a role change', async () => {
    const { rerender } = renderDashboard('ADMINISTRATOR');
    await screen.findByRole('region', { name: 'Ingresos del mes' });

    rerender(
      <ClinicalDashboardPage
        reader={demoReader()}
        role="DENTIST"
        staffId="demo-dentist"
        staffName="Dra. Valentina Ruiz"
      />,
    );

    expect(
      screen.queryByRole('region', { name: 'Ingresos del mes' }),
    ).toBeNull();
  });
});
