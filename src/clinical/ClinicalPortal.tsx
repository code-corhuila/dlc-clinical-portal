import {
  ClinicalPortalComposition,
  type ClinicalShellContext,
} from './composition/ClinicalPortalComposition';

export type { ClinicalShellContext };

/** Federated entry mounted by dlc-front at /app/patients/:patientId. */
export function ClinicalPortal(context: ClinicalShellContext) {
  return <ClinicalPortalComposition {...context} />;
}
