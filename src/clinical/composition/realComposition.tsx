import { useState } from 'react';
import { ClinicalPortalPage } from '../adapter/in/ui/pages/ClinicalPortalPage';
import { createHttpClinicalAdapter } from '../adapter/out/http/httpClinicalAdapter';
import type { PortalHttp } from '../adapter/out/http/portalHttp';
import { ReadPatientForCare } from '../application/readPatientForCare';
import type { ClinicalRole } from '../model/clinicalAccess';

export interface ClinicalRealCompositionProps {
  readonly http: PortalHttp;
  readonly patientId?: string;
  readonly role?: ClinicalRole;
}

/**
 * Real build: reads through the compositor http capability (C06). The owner
 * service authorizes each request; a 403 shows the forbidden state.
 */
export function ClinicalRealComposition({
  http,
  patientId,
  role,
}: ClinicalRealCompositionProps) {
  const [adapter] = useState(() => createHttpClinicalAdapter(http));
  const [patientReader] = useState(() => new ReadPatientForCare(adapter));
  return (
    <ClinicalPortalPage
      patientId={patientId ?? null}
      role={role ?? null}
      clinicalReadAuthorized
      clinicalWriteAuthorized={false}
      readPort={adapter}
      patientReader={patientReader}
      authorName={(authorId) => `Profesional ${authorId.slice(0, 8)}`}
    />
  );
}
