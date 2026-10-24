import { useState } from 'react';
import type { ClinicalRole } from '../model/clinicalAccess';
import type { PortalHttp } from '../adapter/out/http/portalHttp';
import { ClinicalRealComposition } from './realComposition';
import { ClinicalPatientCards } from '../adapter/in/ui/components/ClinicalPatientCards';
import { createHttpClinicalAdapter } from '../adapter/out/http/httpClinicalAdapter';
import { ListCarePatients } from '../application/listCarePatients';
import '../clinical-portal.css';
import { ClinicalDemoPage } from '../adapter/in/ui/pages/ClinicalDemoPage';
import { ClinicalPortalPage } from '../adapter/in/ui/pages/ClinicalPortalPage';
import { ClinicalDashboardPage } from '../adapter/in/ui/pages/ClinicalDashboardPage';
import {
  createDemoClinicalAdapter,
  demoAppointments,
  demoProcedureCatalog,
} from '../adapter/out/demo/demoClinicalAdapter';
import { TreatmentPlan } from '../application/treatmentPlan';
import { CompleteProcedure } from '../application/completeProcedure';
import { DeclareCareCompletion } from '../application/declareCareCompletion';
import { CareClosureTracking } from '../application/careClosureTracking';
import { BillingEstimate } from '../application/billingEstimate';
import { ReadDashboard } from '../application/readDashboard';
import { AmendClinicalEntry } from '../application/amendClinicalEntry';
import { RecordClinicalEntry } from '../application/recordClinicalEntry';
import { ReadPatientForCare } from '../application/readPatientForCare';

/**
 * Synthetic data only in local development or the explicit demo build
 * (`npm run build:demo`) mounted by dlc-front for the front-only delivery.
 * A normal production build never wires the demo adapter.
 */
/**
 * Context the dlc-front shell passes when it mounts a Clinical remote: the
 * patient from the route and the signed-in staff from its session. In the
 * demo build they set the initial selection; the demo selector stays usable.
 */
export interface ClinicalShellContext {
  readonly patientId?: string;
  readonly role?: ClinicalRole;
  readonly staffId?: string;
  readonly staffName?: string;
  /** Display grants from the session permissions; the Clinical API decides. */
  readonly clinicalReadAuthorized?: boolean;
  readonly clinicalWriteAuthorized?: boolean;
  /** Compositor navigation for the demo patient selector (C04). */
  readonly onSelectPatient?: (patientId: string) => void;
  /** Compositor navigation to the Appointments portal from the dashboard (C04). */
  readonly onViewAllAppointments?: () => void;
  /** Compositor http capability (C06); passed down, never kept in globals. */
  readonly http?: PortalHttp;
  /** Mounted inside the dlc-front Dashboard page, which owns its title (C04). */
  readonly embedded?: boolean;
}

function isClinicalDemo(): boolean {
  return (
    import.meta.env.VITE_CLINICAL_DEMO === 'true' &&
    (import.meta.env.DEV || import.meta.env.MODE === 'demo')
  );
}

/**
 * Composition root for the Clinical bounded context.
 * Only the dev-flagged demo wires synthetic in-memory adapters; published
 * shell capabilities will be wired here when their contracts are available.
 */
export function ClinicalPortalComposition(context: ClinicalShellContext) {
  return isClinicalDemo() ? (
    <ClinicalDemoComposition
      key={`${context.patientId}:${context.role}`}
      {...context}
    />
  ) : context.http ? (
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
 * Composition for the federated `./ClinicalDashboard` entry. Production waits
 * for the dlc-front session (role, staff) and an analytics adapter; only the
 * dev-flagged demo wires synthetic snapshots for an administrator.
 */
/**
 * Clinical home (`/app/clinical`): patient cards in care. The demo lists the
 * synthetic patients; the real build reads through the compositor http.
 */
export function ClinicalHomeComposition(
  context: ClinicalShellContext & { readonly query?: string },
) {
  const [lister] = useState(() => {
    if (isClinicalDemo())
      return new ListCarePatients(createDemoClinicalAdapter());
    return context.http
      ? new ListCarePatients(createHttpClinicalAdapter(context.http))
      : undefined;
  });
  const [load] = useState(
    () => () =>
      lister
        ? lister.execute(
            context.role ?? null,
            // The demo keeps its synthetic staff; the real build uses the session grants.
            isClinicalDemo() ||
              (context.clinicalReadAuthorized ?? context.role === 'DENTIST'),
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

export function ClinicalDashboardComposition(context: ClinicalShellContext) {
  return isClinicalDemo() ? (
    <ClinicalDashboardDemo {...context} />
  ) : context.http ? (
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

function ClinicalDashboardDemo(context: ClinicalShellContext) {
  const [reader] = useState(
    () => new ReadDashboard(createDemoClinicalAdapter(), () => new Date()),
  );
  return (
    <ClinicalDashboardPage
      reader={reader}
      role={context.role ?? 'ADMINISTRATOR'}
      staffId={context.staffId ?? 'demo-admin'}
      staffName={context.staffName ?? 'Laura Gómez'}
      onViewAllAppointments={context.onViewAllAppointments}
      embedded={context.embedded}
    />
  );
}

function ClinicalDemoComposition(context: ClinicalShellContext) {
  const [adapter] = useState(createDemoClinicalAdapter);
  const [writer] = useState(() => new RecordClinicalEntry(adapter));
  const [patientReader] = useState(() => new ReadPatientForCare(adapter));
  const [treatmentPlan] = useState(() => new TreatmentPlan(adapter));
  const [completer] = useState(
    () => new CompleteProcedure(adapter, () => crypto.randomUUID()),
  );
  const [amender] = useState(() => new AmendClinicalEntry(adapter));
  const [declarer] = useState(() => new DeclareCareCompletion(adapter));
  const [tracking] = useState(() => new CareClosureTracking(adapter));
  const [estimate] = useState(() => new BillingEstimate(adapter));
  const [dashboard] = useState(
    () => new ReadDashboard(adapter, () => new Date()),
  );

  return (
    <ClinicalDemoPage
      initialPatientId={context.patientId}
      initialRole={context.role}
      embedded={Boolean(context.onSelectPatient)}
      readPort={adapter}
      writer={writer}
      authorName={adapter.authorName}
      patientReader={patientReader}
      treatmentPlan={treatmentPlan}
      completer={completer}
      declarer={declarer}
      tracking={tracking}
      estimate={estimate}
      dashboard={dashboard}
      amender={amender}
      catalog={demoProcedureCatalog}
      appointments={demoAppointments}
    />
  );
}
