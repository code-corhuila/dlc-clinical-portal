import { useState } from 'react';
import { ClinicalDemoPage } from '../adapter/in/ui/pages/ClinicalDemoPage';
import { ClinicalPortalPage } from '../adapter/in/ui/pages/ClinicalPortalPage';
import { createDemoClinicalAdapter } from '../adapter/out/demo/demoClinicalAdapter';
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

  return (
    <ClinicalDemoPage
      readPort={adapter}
      writer={writer}
      authorName={adapter.authorName}
      patientReader={patientReader}
    />
  );
}
