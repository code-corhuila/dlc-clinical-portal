import {
  ClinicalDashboardComposition,
  type ClinicalShellContext,
} from './composition/ClinicalPortalComposition';

/** Federated entry mounted by dlc-front at /app/dashboard (ADR-006, ADR-011). */
export function ClinicalDashboard(context: ClinicalShellContext) {
  return <ClinicalDashboardComposition {...context} />;
}
