import { ClinicalPortalPage } from '../adapter/in/ui/pages/ClinicalPortalPage';

/**
 * Composition root for the Clinical bounded context.
 * Future use cases and published shell capabilities are wired here.
 */
export function ClinicalPortalComposition() {
  return <ClinicalPortalPage />;
}
