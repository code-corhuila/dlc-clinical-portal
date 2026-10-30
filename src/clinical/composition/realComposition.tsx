import { useEffect, useState } from 'react';
import { ClinicalPortalPage } from '../adapter/in/ui/pages/ClinicalPortalPage';
import { createHttpClinicalAdapter } from '../adapter/out/http/httpClinicalAdapter';
import type { PortalHttp } from '../adapter/out/http/portalHttp';
import { AmendClinicalEntry } from '../application/amendClinicalEntry';
import { OpenClinicalRecord } from '../application/openClinicalRecord';
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
  /** Session grants; without them only a Dentist sees clinical content. */
  readonly clinicalReadAuthorized?: boolean;
  readonly clinicalWriteAuthorized?: boolean;
}

/** Use cases over the real adapter; created once per mounted patient context. */
function createRealUseCases(http: PortalHttp) {
  const adapter = createHttpClinicalAdapter(http);
  return {
    adapter,
    patientReader: new ReadPatientForCare(adapter),
    opener: new OpenClinicalRecord(adapter),
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
  clinicalReadAuthorized = role === 'DENTIST',
  clinicalWriteAuthorized = role === 'DENTIST',
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
  // Procedures and the declaration belong to the appointment now EN_ATENCION.
  const [appointmentId, setAppointmentId] = useState<string>();
  useEffect(() => {
    if (!patientId) return;
    let active = true;
    useCases.adapter.readInCareAppointment(patientId).then(
      (id) => active && setAppointmentId(id),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [useCases, patientId]);

  return (
    <ClinicalPortalPage
      patientId={patientId ?? null}
      role={role ?? null}
      clinicalReadAuthorized={clinicalReadAuthorized}
      clinicalWriteAuthorized={clinicalWriteAuthorized}
      readPort={useCases.adapter}
      patientReader={useCases.patientReader}
      opener={useCases.opener}
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
        appointmentId,
      }}
    />
  );
}
