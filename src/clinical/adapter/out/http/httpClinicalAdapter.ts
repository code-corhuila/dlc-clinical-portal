import type { ClinicalRecordEntriesPort } from '../../../application/clinicalRecordEntriesWorkflow';
import type { PatientForCarePort } from '../../../application/readPatientForCare';
import type {
  ProcedurePrice,
  ProcedurePricePort,
} from '../../../application/billingEstimate';
import type { DashboardSnapshotPort } from '../../../application/readDashboard';
import type { DashboardSnapshot } from '../../../model/dashboard';
import type { CarePatientsPort } from '../../../application/listCarePatients';
import type { ClinicalEntryWritePort } from '../../../application/recordClinicalEntry';
import type { ClinicalEntryAmendPort } from '../../../application/amendClinicalEntry';
import type { TreatmentPort } from '../../../application/treatmentPlan';
import type { ProcedureCompletionPort } from '../../../application/completeProcedure';
import type { CareCompletionPort } from '../../../application/declareCareCompletion';
import type { CareClosurePort } from '../../../application/careClosureTracking';
import type { ClinicalEntryPage } from '../../../model/clinicalEntry';
import type { PatientForCare } from '../../../model/patientForCare';
import type { ProcedureCompletion } from '../../../model/procedureCompletion';
import type {
  CareClosure,
  ClinicalCareCompletion,
} from '../../../model/careCompletion';
import type { Treatment } from '../../../model/treatment';
import { send, type PortalHttp } from './portalHttp';

const API = '/api/v1';

interface Page<T> {
  readonly data: readonly T[];
}

/** Read side of the real Clinical adapter over the compositor capability. */
export interface HttpClinicalReads
  extends
    PatientForCarePort,
    ClinicalRecordEntriesPort,
    ProcedurePricePort,
    DashboardSnapshotPort,
    CarePatientsPort {
  readRecordVersion(recordId: string): Promise<number>;
  listTreatments(patientId: string): Promise<readonly Treatment[]>;
  readCareClosure(closureId: string): Promise<CareClosure>;
  /** Appointment of the patient now EN_ATENCION (Appointments), if any. */
  readInCareAppointment(patientId: string): Promise<string | undefined>;
}

/** Real Clinical adapter: every port over the compositor capability. */
export type HttpClinicalAdapter = HttpClinicalReads &
  ClinicalEntryWritePort &
  ClinicalEntryAmendPort &
  TreatmentPort &
  ProcedureCompletionPort &
  CareCompletionPort &
  CareClosurePort;

/** Field names follow the OpenAPI; DTOs are mapped here, never in the domain. */
export function createHttpClinicalAdapter(
  http: PortalHttp,
): HttpClinicalAdapter {
  const get = <T>(path: string, query?: Record<string, string[]>) =>
    send<T>(http, { method: 'GET', path: `${API}${path}`, query });
  // One key per user intent, reused on retries; writes are never retried here.
  const post = <T>(path: string, body: unknown, idempotencyKey: string) =>
    send<T>(http, {
      method: 'POST',
      path: `${API}${path}`,
      body,
      headers: { 'Idempotency-Key': idempotencyKey },
    });

  const adapter: HttpClinicalAdapter = {
    async listCarePatients() {
      // Records the owner already filtered by assignment; names from Patients.
      const records =
        await get<Page<{ patientId: string }>>('/clinical-records');
      return Promise.all(
        records.data.map((record) => adapter.readPatient(record.patientId)),
      );
    },
    async readPatient(patientId) {
      // PatientView: Patient or PatientForCare; keep only the care projection.
      const patient = await get<PatientForCare>(`/patients/${patientId}`);
      return {
        id: patient.id,
        name: patient.name,
        ...(patient.phone ? { phone: patient.phone } : {}),
        ...(patient.email ? { email: patient.email } : {}),
        status: patient.status,
        version: patient.version,
      };
    },
    async findRecordId(patientId) {
      const page = await get<Page<{ id: string }>>('/clinical-records', {
        patientId: [patientId],
      });
      const record = page.data[0];
      if (!record) throw { code: 'NOT_FOUND' };
      return record.id;
    },
    readEntries(recordId) {
      return get<ClinicalEntryPage>(`/clinical-records/${recordId}/entries`);
    },
    async readRecordVersion(recordId) {
      return (await get<{ version: number }>(`/clinical-records/${recordId}`))
        .version;
    },
    async listTreatments(patientId) {
      return (
        await get<Page<Treatment>>('/treatments', { patientId: [patientId] })
      ).data;
    },
    readCareClosure(closureId) {
      return get<CareClosure>(`/care-closures/${closureId}`);
    },
    async readInCareAppointment(patientId) {
      const page = await get<Page<{ id: string; status: string }>>(
        '/appointments',
        { patientId: [patientId], limit: ['100'] },
      );
      return page.data.find((item) => item.status === 'EN_ATENCION')?.id;
    },
    async listProcedurePrices() {
      const page = await get<Page<ProcedurePrice>>('/procedure-prices');
      return page.data.map(
        ({ procedureCode, name, basePrice, currency, status }) => ({
          procedureCode,
          name,
          basePrice,
          currency,
          status,
        }),
      );
    },
    async appendEntry(recordId, request, idempotencyKey) {
      await post(
        `/clinical-records/${recordId}/entries`,
        request,
        idempotencyKey,
      );
    },
    async amendEntry(entryId, request, idempotencyKey) {
      await post(
        `/clinical-entries/${entryId}/amendments`,
        request,
        idempotencyKey,
      );
    },
    planTreatment(request, idempotencyKey) {
      return post<Treatment>('/treatments', request, idempotencyKey);
    },
    startTreatment(treatmentId, expectedVersion, idempotencyKey) {
      return post<Treatment>(
        `/treatments/${treatmentId}/starts`,
        { expectedVersion },
        idempotencyKey,
      );
    },
    completeProcedure(procedureId, request, idempotencyKey) {
      return post<ProcedureCompletion>(
        `/procedures/${procedureId}/completions`,
        request,
        idempotencyKey,
      );
    },
    declareCareCompleted(recordId, request, idempotencyKey) {
      return post<ClinicalCareCompletion>(
        `/clinical-records/${recordId}/care-completions`,
        request,
        idempotencyKey,
      );
    },
    retryCareClosure(closureId, request, idempotencyKey) {
      return post<CareClosure>(
        `/care-closures/${closureId}/retries`,
        request,
        idempotencyKey,
      );
    },
    readDashboard() {
      // HU-CLN-003: the service scopes by the token's role (clinical-service.yaml).
      return get<DashboardSnapshot>('/clinical-analytics/dashboard');
    },
  };
  return adapter;
}
