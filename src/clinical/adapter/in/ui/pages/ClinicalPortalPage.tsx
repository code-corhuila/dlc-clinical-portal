/**
 * Current inbound UI adapter for the Clinical remote.
 */
export function ClinicalPortalPage() {
  return (
    <main className="portal-placeholder" aria-labelledby="clinical-portal-title">
      <h1 id="clinical-portal-title">Clinical portal</h1>
      <p>The Clinical remote is available for federation.</p>
      <p>
        Domain workflows require the shared client and session supplied by <code>dlc-front</code>.
      </p>
    </main>
  );
}
