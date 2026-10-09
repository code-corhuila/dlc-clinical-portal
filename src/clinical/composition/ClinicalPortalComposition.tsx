import { useState } from 'react';
import { ClinicalDemoPage } from '../adapter/in/ui/pages/ClinicalDemoPage';
import { ClinicalPortalPage } from '../adapter/in/ui/pages/ClinicalPortalPage';
import {
  createDemoClinicalAdapter,
  demoAppointments,
  demoProcedureCatalog,
} from '../adapter/out/demo/demoClinicalAdapter';
import { TreatmentPlan } from '../application/treatmentPlan';
import { CompleteProcedure } from '../application/completeProcedure';
import { DeclareCareCompletion } from '../application/declareCareCompletion';
import { CareClosureTracking } from '../application/careClosureTracking';
import { AmendClinicalEntry } from '../application/amendClinicalEntry';
import { RecordClinicalEntry } from '../application/recordClinicalEntry';
import { ReadPatientForCare } from '../application/readPatientForCare';

/**
 * Composition root for the Clinical bounded context.
 * Only the dev-flagged demo wires synthetic in-memory adapters; published
 * shell capabilities will be wired here when their contracts are available.
 */
export function ClinicalPortalComposition() {
  return import.meta.env.DEV &&
    import.meta.env.VITE_CLINICAL_DEMO === 'true' ? (
    <ClinicalDemoComposition />
  ) : (
    <ClinicalPortalPage />
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
      amender={amender}
      catalog={demoProcedureCatalog}
      appointments={demoAppointments}
    />
  );
}
