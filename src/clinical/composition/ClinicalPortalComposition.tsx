import { useState } from 'react';
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
export function ClinicalPortalComposition() {
  return isClinicalDemo() ? (
    <ClinicalDemoComposition />
  ) : (
    <ClinicalPortalPage />
  );
}

/**
 * Composition for the federated `./ClinicalDashboard` entry. Production waits
 * for the dlc-front session (role, staff) and an analytics adapter; only the
 * dev-flagged demo wires synthetic snapshots for an administrator.
 */
export function ClinicalDashboardComposition() {
  return isClinicalDemo() ? (
    <ClinicalDashboardDemo />
  ) : (
    <main className="portal-placeholder">
      <h1>Clinical dashboard</h1>
      <p>
        Clinical analytics require the shared session supplied by dlc-front.
      </p>
    </main>
  );
}

function ClinicalDashboardDemo() {
  const [reader] = useState(
    () => new ReadDashboard(createDemoClinicalAdapter(), () => new Date()),
  );
  return (
    <ClinicalDashboardPage
      reader={reader}
      role="ADMINISTRATOR"
      staffId="demo-admin"
      staffName="Laura Gómez"
    />
  );
}

function ClinicalDemoComposition() {
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
