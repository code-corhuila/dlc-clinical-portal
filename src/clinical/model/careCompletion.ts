/** `ClinicalCareCompletion` (`clinical-service.yaml`): no money, no appointment state. */
export interface ClinicalCareCompletion {
  readonly id: string;
  readonly clinicalRecordId: string;
  readonly consultationId: string;
  readonly appointmentId: string;
  readonly patientId: string;
  readonly dentistId: string;
  readonly procedureIds: readonly string[];
  readonly manualChargeIds: readonly string[];
  readonly completedAt: string;
  readonly clinicalVersion?: number;
}

export interface CareCompletionRequest {
  readonly consultationId: string;
  readonly appointmentId: string;
  readonly expectedVersion: number;
}
