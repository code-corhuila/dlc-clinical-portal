import { ClinicalDashboardComposition } from './composition/ClinicalPortalComposition';

/** Federated entry mounted by dlc-front at /app/dashboard (ADR-006, ADR-011). */
export function ClinicalDashboard() {
  return <ClinicalDashboardComposition />;
}
