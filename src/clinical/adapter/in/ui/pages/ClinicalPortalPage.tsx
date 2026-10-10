import { demoRecordStatus } from '../../../../fixtures/clinicalFixtures';
import { ClinicalRecordEntries } from '../components/ClinicalRecordEntries';

/**
 * Current inbound UI adapter for the Clinical remote.
 */
export function ClinicalPortalPage() {
  const demoEnabled =
    import.meta.env.DEV && import.meta.env.VITE_CLINICAL_DEMO === 'true';

  return (
    <main
      className="portal-placeholder"
      aria-labelledby="clinical-portal-title"
    >
      <h1 id="clinical-portal-title">Clinical portal</h1>
      {demoEnabled && (
        <p>Modo demostración: datos sintéticos; sin integración con el API.</p>
      )}
      {demoEnabled && (
        <ClinicalRecordEntries
          role="DENTIST"
          clinicalReadAuthorized
          status={demoRecordStatus}
        />
      )}
      <p>The Clinical remote is available for federation.</p>
      <p>
        Domain workflows require the shared client and session supplied by{' '}
        <code>dlc-front</code>.
      </p>
    </main>
  );
}
