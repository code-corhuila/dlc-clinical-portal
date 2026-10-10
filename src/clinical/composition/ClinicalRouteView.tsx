import type { ClinicalRole } from '../model/clinicalAccess';
import type { PortalNavigation, PortalRoute, SessionSnapshot } from '../entry';
import type { PortalHttp } from '../adapter/out/http/portalHttp';
import { DEMO_PATIENTS } from '../adapter/in/ui/pages/ClinicalDemoPage';
import {
  ClinicalDashboardComposition,
  ClinicalPortalComposition,
  isClinicalDemo,
  type ClinicalShellContext,
} from './ClinicalPortalComposition';

const CLINICAL_ROLES: readonly ClinicalRole[] = [
  'DENTIST',
  'ADMINISTRATOR',
  'SECRETARY_ASSISTANT',
];

/** Viewer from the Auth projection; UI claims are never authorization. */
function viewer(snapshot: SessionSnapshot): ClinicalShellContext {
  const user = snapshot.state === 'authenticated' ? snapshot.user : null;
  const role = CLINICAL_ROLES.find((item) => user?.roles.includes(item));
  return user ? { role, staffId: user.id, staffName: user.name } : {};
}

/** Interprets the compositor local path (C04): /analytics, /{patientId} or portal 404. */
export function ClinicalRouteView({
  route,
  session,
  navigation,
  http,
}: {
  readonly route: PortalRoute;
  readonly session: SessionSnapshot;
  readonly navigation: PortalNavigation;
  readonly http?: PortalHttp;
}) {
  // C04: the shell owns the URL; selecting a patient is a navigation request.
  const onSelectPatient = (patientId: string) =>
    void navigation.request({ path: `/app/clinical/${patientId}` });
  // C05/C07: without an authenticated session no private clinical content stays rendered.
  if (session.state !== 'authenticated')
    return (
      <main className="portal-placeholder">
        <h1>Sesión no disponible</h1>
      </main>
    );
  const segments = route.localPath.split('/').filter(Boolean);
  if (segments.length === 1 && segments[0] === 'analytics')
    return (
      <ClinicalDashboardComposition
        {...viewer(session)}
        onViewAllAppointments={() =>
          void navigation.request({ path: '/app/appointments/calendar' })
        }
      />
    );
  if (segments.length === 1)
    return (
      <ClinicalPortalComposition
        {...viewer(session)}
        patientId={segments[0]}
        onSelectPatient={onSelectPatient}
        http={http}
      />
    );
  return (
    <main className="portal-placeholder">
      <h1>
        {segments.length === 0
          ? 'Seleccione un paciente'
          : 'Página clínica no encontrada'}
      </h1>
      {segments.length === 0 && isClinicalDemo() && (
        <select
          aria-label="Paciente"
          defaultValue=""
          onChange={(event) => onSelectPatient(event.target.value)}
        >
          <option value="" disabled>
            Paciente sintético…
          </option>
          {DEMO_PATIENTS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      )}
    </main>
  );
}
