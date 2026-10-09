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

  it('draws the weekly activity chart with a textual alternative', async () => {
    renderDashboard('ADMINISTRATOR');

    const chart = await screen.findByRole('img', {
      name: /Actividad semanal: Lun 8, Mar 11, Mié 15/,
    });
    expect(chart.querySelectorAll('.db-bar')).toHaveLength(7);
    expect(screen.getByText('Mié: 15')).toBeInTheDocument();
  });

  it('shows revenue compactly as in the mockup and keeps the exact amount accessible', async () => {
    renderDashboard('ADMINISTRATOR');

    const revenue = await screen.findByRole('region', {
      name: 'Ingresos del mes',
    });
    expect(revenue.querySelector('strong')).toHaveTextContent(/^\$14,5 M/);
    expect(revenue).toHaveTextContent(/14\.500\.000,00/);
  });

  it('highlights the busiest day of the week', async () => {
    renderDashboard('ADMINISTRATOR');

    const chart = await screen.findByRole('img', { name: /Actividad semanal/ });
    const peak = chart.querySelector('[data-peak="true"]');
    expect(peak).toHaveTextContent('Mié');
    expect(chart.querySelectorAll('[data-peak="true"]')).toHaveLength(1);
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

  it('highlights every day that ties for the busiest of the week', async () => {
    const demo = createDemoClinicalAdapter();
    const reader = new ReadDashboard(
      {
        readDashboard: async (scope) => ({
          ...(await demo.readDashboard(scope)),
          weeklyActivity: [
            { day: 'Lun', count: 9 },
            { day: 'Mar', count: 4 },
            { day: 'Mié', count: 9 },
          ],
        }),
      },
      now,
    );
    renderDashboard('ADMINISTRATOR', reader);

    const chart = await screen.findByRole('img', { name: /Actividad semanal/ });
    const peaks = [...chart.querySelectorAll('[data-peak="true"]')];
    expect(peaks.map((bar) => bar.querySelector('small')?.textContent)).toEqual(
      ['Lun', 'Mié'],
    );
  });
});
