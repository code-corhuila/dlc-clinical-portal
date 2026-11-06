import { useState } from 'react';
import type { ClinicalRole } from '../model/clinicalAccess';
import type { PortalHttp } from '../adapter/out/http/portalHttp';
import { ClinicalRealComposition } from './realComposition';
import { ClinicalPatientCards } from '../adapter/in/ui/components/ClinicalPatientCards';
import { createHttpClinicalAdapter } from '../adapter/out/http/httpClinicalAdapter';
import { ListCarePatients } from '../application/listCarePatients';
import '../clinical-portal.css';
import { ClinicalPortalPage } from '../adapter/in/ui/pages/ClinicalPortalPage';
import { ClinicalDashboardPage } from '../adapter/in/ui/pages/ClinicalDashboardPage';
import { ReadDashboard } from '../application/readDashboard';

/**
 * Context the dlc-front shell passes when it mounts a Clinical remote: the
 * patient from the route and the signed-in staff from its session.
 */
export interface ClinicalShellContext {
  readonly patientId?: string;
  readonly role?: ClinicalRole;
  readonly staffId?: string;
  readonly staffName?: string;
  /** Display grants from the session permissions; the Clinical API decides. */
  readonly clinicalReadAuthorized?: boolean;
  readonly clinicalWriteAuthorized?: boolean;
  /** Compositor navigation to a patient's clinical record (C04). */
  readonly onSelectPatient?: (patientId: string) => void;
  /** Compositor navigation to the Appointments portal from the dashboard (C04). */
  readonly onViewAllAppointments?: () => void;
  /** Compositor http capability (C06); passed down, never kept in globals. */
  readonly http?: PortalHttp;
  /** Mounted inside the dlc-front Dashboard page, which owns its title (C04). */
  readonly embedded?: boolean;
}

/**
 * Composition root for the Clinical bounded context. Every workflow runs over
 * the compositor http (C06); without it the remote waits for dlc-front.
 */
export function ClinicalPortalComposition(context: ClinicalShellContext) {
  return context.http ? (
    <ClinicalRealComposition
      key={`${context.patientId}:${context.role}`}
      http={context.http}
      patientId={context.patientId}
      role={context.role}
      clinicalReadAuthorized={context.clinicalReadAuthorized}
      clinicalWriteAuthorized={context.clinicalWriteAuthorized}
    />
  ) : (
    <ClinicalPortalPage />
  );
}

/**
 * Clinical home (`/app/clinical`): patient cards in care, read through the
 * compositor http.
 */
export function ClinicalHomeComposition(
  context: ClinicalShellContext & { readonly query?: string },
) {
  const [lister] = useState(() =>
    context.http
      ? new ListCarePatients(createHttpClinicalAdapter(context.http))
      : undefined,
  );
  const [load] = useState(
    () => () =>
      lister
        ? lister.execute(
            context.role ?? null,
            context.clinicalReadAuthorized ?? context.role === 'DENTIST',
          )
        : Promise.reject({
            code: 'UNAVAILABLE',
            message:
              'La lista clínica requiere la sesión y el cliente de dlc-front.',
          }),
  );
  return (
    <ClinicalPatientCards
      load={load}
      initialQuery={context.query}
      onOpen={(patientId) => context.onSelectPatient?.(patientId)}
    />
  );
}

/**
 * Composition for the federated `./ClinicalDashboard` entry: it waits for the
 * dlc-front session (role, staff) and reads analytics over its http.
 */
export function ClinicalDashboardComposition(context: ClinicalShellContext) {
  return context.http ? (
    <ClinicalDashboardReal {...context} http={context.http} />
  ) : (
    <main className="portal-placeholder">
      <h1>Clinical dashboard</h1>
      <p>
        Clinical analytics require the shared session supplied by dlc-front.
      </p>
    </main>
  );
}

/** HU-CLN-003 over the compositor http (C06); the service scopes by role. */
function ClinicalDashboardReal(
  context: ClinicalShellContext & { readonly http: PortalHttp },
) {
  const [reader] = useState(
    () =>
      new ReadDashboard(
        createHttpClinicalAdapter(context.http),
        () => new Date(),
      ),
  );
  return (
    <ClinicalDashboardPage
      reader={reader}
      role={context.role ?? null}
      staffId={context.staffId ?? ''}
      staffName={context.staffName ?? ''}
      onViewAllAppointments={context.onViewAllAppointments}
      embedded={context.embedded}
    />
  );
}
