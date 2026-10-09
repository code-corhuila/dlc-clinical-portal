import { useEffect, useState } from 'react';
import type { ReadDashboard } from '../../../../application/readDashboard';
import type { ClinicalRole } from '../../../../model/clinicalAccess';
import { formatCop } from '../../../../model/copMoney';
import type { DashboardSnapshot } from '../../../../model/dashboard';
import { portFailureMessage } from '../../../../model/portFailure';
import './clinical-dashboard.css';

export interface ClinicalDashboardPageProps {
  readonly reader: ReadDashboard;
  readonly role: ClinicalRole | null;
  readonly staffId: string;
  readonly staffName: string;
}

type View =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; snapshot: DashboardSnapshot; stale: boolean };

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

/** KPI cards; revenue appears only when the use case kept it (Administrator). */
function kpis(data: DashboardSnapshot): [string, string | number, string][] {
  const { count, deltaVsYesterday: delta } = data.todayAppointments;
  const cards: [string, string | number, string][] = [
    [
      'Citas de hoy',
      count,
      `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)} vs ayer`,
    ],
    ['Pacientes pendientes', data.pendingPatients, 'En sala de espera'],
  ];
  if (data.monthlyRevenue) {
    const { amount, changePercent: change } = data.monthlyRevenue;
    cards.push([
      'Ingresos del mes',
      formatCop(amount),
      `${change >= 0 ? '+' : ''}${change} % vs mes anterior`,
    ]);
  }
  return cards;
}

/** Clinical Analytics dashboard (Figma 88:1998); mounted by dlc-front. */
export function ClinicalDashboardPage({
  reader,
  role,
  staffId,
  staffName,
}: ClinicalDashboardPageProps) {
  const key = `${role}:${staffId}`;
  const [loaded, setLoaded] = useState<{ key: string; view: View }>();
  // A result from another role/staff context is never shown while reloading.
  const view: View = loaded?.key === key ? loaded.view : { kind: 'loading' };

  useEffect(() => {
    let active = true;
    reader.execute({ role, staffId }).then(
      (result) =>
        active && setLoaded({ key, view: { kind: 'ready', ...result } }),
      (error) =>
        active &&
        setLoaded({
          key,
          view: {
            kind: 'error',
            message: portFailureMessage(
              error,
              'No fue posible cargar el panel.',
            ),
          },
        }),
    );
    return () => {
      active = false;
    };
  }, [key, reader, role, staffId]);

  return (
    <main className="db-page" aria-labelledby="dashboard-title">
      <h1 id="dashboard-title">Panel</h1>
      <p>Bienvenida de nuevo, {staffName}. Esto es lo que sucede hoy.</p>
      {view.kind === 'loading' && <p role="status">Cargando panel…</p>}
      {view.kind === 'error' && <p role="alert">{view.message}</p>}
      {view.kind === 'ready' && (
        <>
          {view.stale && (
            <p role="status" className="db-stale">
              Datos desactualizados: solo informativos, no habilitan acciones.
            </p>
          )}
          <div className="db-kpis">
            {kpis(view.snapshot).map(([label, value, detail]) => (
              <section key={label} aria-label={label}>
                <h2>{label}</h2>
                <strong>{value}</strong>
                <span>{detail}</span>
              </section>
            ))}
          </div>
          <div className="db-grid">
            <section aria-label="Actividad semanal" className="db-card">
              <h2>Actividad semanal</h2>
              <ul>
                {view.snapshot.weeklyActivity.map((item) => (
                  <li key={item.day}>
                    {item.day}: {item.count}
                  </li>
                ))}
              </ul>
            </section>
            <section
              aria-label="Próximas citas"
              className="db-card db-upcoming"
            >
              <h2>Próximas citas</h2>
              <ul>
                {view.snapshot.upcomingAppointments.map((item) => (
                  <li key={item.id}>
                    <span aria-hidden="true">{initials(item.patientName)}</span>
                    <div>
                      <strong>{item.patientName}</strong>
                      <small>{item.urgent ? '⚠ Urgente' : item.reason}</small>
                    </div>
                    <time>{item.time}</time>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <p>Actualizado: {view.snapshot.asOf.slice(11, 16)} UTC</p>
        </>
      )}
    </main>
  );
}
