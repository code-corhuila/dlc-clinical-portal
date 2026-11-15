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
  /** The encounter closure opened by this declaration (ADR-014). */
  readonly careClosureId: string;
}

/** `CareClosure`: one per encounter, opened by the Dentist declaration (ADR-014, ADR-015). */
export interface CareClosure {
  readonly id: string;
  readonly clinicalRecordId: string;
  readonly consultationId: string;
  readonly appointmentId: string;
  readonly procedureIds: readonly string[];
  readonly manualChargeIds: readonly string[];
  readonly status:
    | 'AWAITING_ADMINISTRATIVE_FINALIZATION'
    | 'CLOSURE_PENDING'
    | 'CLOSURE_COMPLETED'
    | 'CLOSURE_FAILED';
  readonly appointmentOutcome?: 'PENDING' | 'COMPLETED';
  readonly billingOutcome?: 'PENDING' | 'COMPLETED';
  readonly failureReason?: string;
  readonly version: number;
}

export interface CareCompletionRequest {
  readonly consultationId: string;
  readonly appointmentId: string;
  readonly expectedVersion: number;
}
