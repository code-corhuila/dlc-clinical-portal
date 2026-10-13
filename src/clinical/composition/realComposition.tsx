import { useEffect, useState } from 'react';
import { ClinicalPortalPage } from '../adapter/in/ui/pages/ClinicalPortalPage';
import { createHttpClinicalAdapter } from '../adapter/out/http/httpClinicalAdapter';
import type { PortalHttp } from '../adapter/out/http/portalHttp';
import { AmendClinicalEntry } from '../application/amendClinicalEntry';
import { BillingEstimate } from '../application/billingEstimate';
import { CareClosureTracking } from '../application/careClosureTracking';
import { CompleteProcedure } from '../application/completeProcedure';
import { DeclareCareCompletion } from '../application/declareCareCompletion';
import { ReadPatientForCare } from '../application/readPatientForCare';
import { RecordClinicalEntry } from '../application/recordClinicalEntry';
import { TreatmentPlan } from '../application/treatmentPlan';
import type { ClinicalRole } from '../model/clinicalAccess';

export interface ClinicalRealCompositionProps {
  readonly http: PortalHttp;
  readonly patientId?: string;
  readonly role?: ClinicalRole;
}

/** Use cases over the real adapter; created once per mounted patient context. */
function createRealUseCases(http: PortalHttp) {
  const adapter = createHttpClinicalAdapter(http);
  return {
    adapter,
    patientReader: new ReadPatientForCare(adapter),
    writer: new RecordClinicalEntry(adapter),
    amender: new AmendClinicalEntry(adapter),
    declarer: new DeclareCareCompletion(adapter),
    plan: new TreatmentPlan(adapter),
    completer: new CompleteProcedure(adapter, () => crypto.randomUUID()),
    tracking: new CareClosureTracking(adapter),
    estimate: new BillingEstimate(adapter),
  };
}

/**
 * Real build: reads and writes through the compositor http capability (C06).
 * The owner service authorizes every request; a 403 shows the forbidden state.
 */
export function ClinicalRealComposition({
  http,
  patientId,
  role,
}: ClinicalRealCompositionProps) {
  const [useCases] = useState(() => createRealUseCases(http));
  // Planning catalog comes from the Billing-owned price list (codes and names).
  const [catalog, setCatalog] = useState<{ code: string; label: string }[]>([]);
  useEffect(() => {
    let active = true;
    useCases.adapter.listProcedurePrices().then(
      (prices) =>
        active &&
        setCatalog(
          prices
            .filter((price) => price.status === 'ACTIVE')
            .map((price) => ({ code: price.procedureCode, label: price.name })),
        ),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [useCases]);

  return (
    <ClinicalPortalPage
      patientId={patientId ?? null}
      role={role ?? null}
      clinicalReadAuthorized
      clinicalWriteAuthorized
      readPort={useCases.adapter}
      patientReader={useCases.patientReader}
      writer={useCases.writer}
      amender={useCases.amender}
      declarer={useCases.declarer}
      authorName={(authorId) => `Profesional ${authorId.slice(0, 8)}`}
      treatments={{
        plan: useCases.plan,
        completer: useCases.completer,
        tracking: useCases.tracking,
        estimate: useCases.estimate,
        catalog,
      }}
    />
  );
}
