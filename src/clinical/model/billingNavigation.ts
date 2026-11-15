export interface ManualChargeSource {
  readonly appointmentId: string;
  readonly procedureId: string;
  readonly sourceRecordId: string;
}

/** Only source identifiers cross the portal boundary, never clinical text or money. */
export function manualChargePath(
  patientId: string,
  source: ManualChargeSource,
): string {
  const fields = {
    patientId,
    appointmentId: source.appointmentId,
    procedureId: source.procedureId,
    sourceRecordId: source.sourceRecordId,
  };
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!Object.values(fields).every((value) => uuid.test(value)))
    throw new Error('Invalid care source');
  return `/app/billing/manual-charges/new?${new URLSearchParams(fields).toString()}`;
}
