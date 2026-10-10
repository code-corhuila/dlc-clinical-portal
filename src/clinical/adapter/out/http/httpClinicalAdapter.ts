import type { ClinicalRecordEntriesPort } from '../../../application/clinicalRecordEntriesWorkflow';
import type { PatientForCarePort } from '../../../application/readPatientForCare';
import type {
  ProcedurePrice,
  ProcedurePricePort,
} from '../../../application/billingEstimate';
import type { DashboardSnapshotPort } from '../../../application/readDashboard';
import type { ClinicalEntryPage } from '../../../model/clinicalEntry';
import type { PatientForCare } from '../../../model/patientForCare';
import type { CareClosure } from '../../../model/procedureCompletion';
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
    DashboardSnapshotPort {
  readRecordVersion(recordId: string): Promise<number>;
  listTreatments(patientId: string): Promise<readonly Treatment[]>;
  readCareClosure(closureId: string): Promise<CareClosure>;
}

/** Field names follow the OpenAPI; DTOs are mapped here, never in the domain. */
export function createHttpClinicalAdapter(http: PortalHttp): HttpClinicalReads {
  const get = <T>(path: string, query?: Record<string, string[]>) =>
    send<T>(http, { method: 'GET', path: `${API}${path}`, query });

  return {
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
    async readDashboard() {
      // HU-CLN-003: no Gateway analytics operation exists yet; never invent one.
      throw {
        code: 'UNAVAILABLE',
        message: 'La analítica clínica aún no tiene un contrato publicado.',
      };
    },
  };
}
