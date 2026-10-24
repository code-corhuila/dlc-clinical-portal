import type { ClinicalRecordEntriesPort } from '../../../application/clinicalRecordEntriesWorkflow';
import type { ClinicalEntryWritePort } from '../../../application/recordClinicalEntry';
import type { PatientForCarePort } from '../../../application/readPatientForCare';
import type { PatientForCare } from '../../../model/patientForCare';
import type { TreatmentPort } from '../../../application/treatmentPlan';
import type { ClinicalEntryAmendPort } from '../../../application/amendClinicalEntry';
import type { ProcedureCompletionPort } from '../../../application/completeProcedure';
import type { ProcedureCompletion } from '../../../model/procedureCompletion';
import type { CareClosure } from '../../../model/careCompletion';
import type { CareCompletionPort } from '../../../application/declareCareCompletion';
import type { CareClosurePort } from '../../../application/careClosureTracking';
import type { ProcedurePricePort } from '../../../application/billingEstimate';
import type { DashboardSnapshotPort } from '../../../application/readDashboard';
import type { CarePatientsPort } from '../../../application/listCarePatients';
import type { Treatment } from '../../../model/treatment';
import type {
  ClinicalEntry,
  ClinicalEntryPage,
} from '../../../model/clinicalEntry';
import {
  consultationEntry,
  evolutionEntry,
} from '../../../fixtures/clinicalFixtures';
import { demoSeedPatients } from './demoSeed';

/** In-memory synthetic adapter, wired only by the dev demo composition. */
export interface DemoClinicalAdapter
  extends
    ClinicalRecordEntriesPort,
    ClinicalEntryWritePort,
    PatientForCarePort,
    TreatmentPort,
    ClinicalEntryAmendPort,
    ProcedureCompletionPort,
    CareCompletionPort,
    CareClosurePort,
    ProcedurePricePort,
    DashboardSnapshotPort,
    CarePatientsPort {
  authorName(authorId: string): string;
}

/** Synthetic Billing catalog references: codes and names only, never prices. */
export const demoProcedureCatalog = [
  { code: 'D1110', label: 'Limpieza profunda' },
  { code: 'D2391', label: 'Resina simple' },
  { code: 'D7140', label: 'Extracción simple' },
] as const;

/** Synthetic EN_ATENCION appointment per assigned patient. */
function buildDemoAppointments(): Record<string, string> {
  const appointments: Record<string, string> = {
    'patient-a': 'appointment-a',
    'patient-b': 'appointment-b',
  };
  for (const { patient, appointmentId } of demoSeedPatients)
    if (appointmentId) appointments[patient.id] = appointmentId;
  return appointments;
}

// Pure, so the real build drops the synthetic data when nothing imports it.
export const demoAppointments = /* @__PURE__ */ buildDemoAppointments();

const records: Record<string, string> = {
  'patient-a': 'record-a',
  'patient-b': 'record-b',
  'patient-d': 'record-d',
};
/** Synthetic encounter already closed clinically (HU-XCT-001 owns closure). */
const closedMessage = 'La atención está cerrada; no admite nuevos registros.';
const patients: Record<string, PatientForCare> = {
  'patient-a': {
    id: 'patient-a',
    name: 'Ana García Rodríguez',
    phone: '+57 300 123 4567',
    status: 'ACTIVE',
    version: 1,
  },
  'patient-d': {
    id: 'patient-d',
    name: 'Lucía Torres Pardo',
    phone: '+57 320 555 0101',
    status: 'ACTIVE',
    version: 1,
  },
  'patient-b': {
    id: 'patient-b',
    name: 'Mateo Herrera Gómez',
    phone: '+57 310 765 4321',
    status: 'ACTIVE',
    version: 1,
  },
};
const authors: Record<string, string> = {
  'demo-dentist': 'Dra. Valentina Ruiz',
  [consultationEntry.authorId]: 'Dra. Valentina Ruiz',
  [evolutionEntry.authorId]: 'Dr. Mateo López',
};

export function createDemoClinicalAdapter(): DemoClinicalAdapter {
  const closedRecords = new Set(['record-d']);
  /** Idempotency-Key replay: a repeated intent has no second effect. */
  const applied = new Set<string>();
  /** Responses of keyed intents, replayed when the same key arrives again. */
  const replies = new Map<string, Promise<unknown>>();
  function replay<T>(key: string, effect: () => Promise<T>): Promise<T> {
    if (!replies.has(key)) replies.set(key, effect());
    return replies.get(key) as Promise<T>;
  }
  const versions: Record<string, number> = {};
  const version = (recordId: string) => versions[recordId] ?? 1;
  const entries: Record<string, ClinicalEntry[]> = {
    'record-a': [
      { ...consultationEntry, recordId: 'record-a' },
      ...[
        'Caries oclusal profunda - Pieza 18',
        'Gingivitis leve localizada',
      ].map((text, index): ClinicalEntry => ({
        ...consultationEntry,
        id: `diagnosis-a-${index + 1}`,
        recordId: 'record-a',
        kind: 'DIAGNOSIS',
        text,
        consultationId: consultationEntry.id,
      })),
    ],
    'record-b': [{ ...evolutionEntry, recordId: 'record-b' }],
    'record-d': [
      { ...consultationEntry, id: 'consultation-d', recordId: 'record-d' },
    ],
  };
  const treatments: Record<string, Treatment[]> = {
    'patient-a': [
      {
        id: 'treatment-a-1',
        patientId: 'patient-a',
        clinicalReason: 'Profilaxis de control',
        status: 'PLANNED',
        procedures: [
          ...['D1110', 'D2391', 'D7140'].map((procedureCode, index) => ({
            id: `procedure-a-${index + 1}`,
            procedureCode,
            appointmentId: 'appointment-a',
            status: 'PLANNED' as const,
          })),
        ],
        version: 1,
      },
    ],
    'patient-b': [],
    'patient-d': [],
  };
  for (const seed of demoSeedPatients) {
    patients[seed.patient.id] = seed.patient;
    records[seed.patient.id] = seed.patient.id.replace('patient-', 'record-');
    entries[records[seed.patient.id]] = [...seed.entries];
    treatments[seed.patient.id] = [...seed.treatments];
  }
  /** Demo convergence: unpriced additional needs fail Billing until a retry. */
  // observed: the declared state was already shown once; reads then progress.
  const closures: Record<
    string,
    CareClosure & { needsPrice: boolean; observed?: boolean }
  > = {};
  // Procedures whose extras still need a manual price in Billing.
  const unpriced = new Set<string>();
  return {
    /** Synthetic dashboard facts; a professional scope sees only own work. */
    async listCarePatients() {
      return Object.values(patients);
    },
    async readDashboard(scope) {
      const own = scope.scope === 'PROFESSIONAL';
      const counts = own ? [3, 4, 6, 2, 5, 1, 0] : [8, 11, 15, 6, 12, 4, 1];
      const today = new Date();
      const monday = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
        ),
      );
      monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
      return {
        asOf: new Date().toISOString(),
        todayAppointments: { count: own ? 5 : 12, deltaVsYesterday: 2 },
        monthlyRevenue: own
          ? undefined
          : { amount: '14500000.00', changePercent: 15 },
        weeklyActivity: counts.map((count, index) => {
          const day = new Date(monday);
          day.setUTCDate(monday.getUTCDate() + index);
          return { day: day.toISOString().slice(0, 10), count };
        }),
      };
    },
    /** Synthetic Billing catalog prices (exact COP strings); read-only for Clinical. */
    async listProcedurePrices() {
      return [
        ['D1110', 'Limpieza profunda', '180000.00'],
        ['D2391', 'Resina simple', '150000.00'],
        ['D7140', 'Extracción simple', '220000.00'],
      ].map(([procedureCode, name, basePrice]) => ({
        procedureCode,
        name,
        basePrice,
        currency: 'COP' as const,
        status: 'ACTIVE' as const,
      }));
    },
    async readCareClosure(closureId) {
      const closure = closures[closureId];
      if (!closure) throw { code: 'NOT_FOUND' };
      const { needsPrice, observed, ...current } = closure;
      // ADR-015: Citas finalizes first; the awaiting state never fails.
      if (current.status === 'AWAITING_ADMINISTRATIVE_FINALIZATION') {
        if (!observed) {
          closures[closureId] = { ...closure, observed: true };
          return current;
        }
        const finalized: CareClosure = {
          ...current,
          status: 'CLOSURE_PENDING',
          appointmentOutcome: 'COMPLETED',
          version: current.version + 1,
        };
        closures[closureId] = { ...finalized, needsPrice };
        return finalized;
      }
      if (current.status !== 'CLOSURE_PENDING') return current;
      const next: CareClosure = needsPrice
        ? {
            ...current,
            status: 'CLOSURE_FAILED',
            appointmentOutcome: 'COMPLETED',
            billingOutcome: 'PENDING',
            failureReason:
              'Facturación requiere el precio manual de los extras.',
            version: current.version + 1,
          }
        : {
            ...current,
            status: 'CLOSURE_COMPLETED',
            appointmentOutcome: 'COMPLETED',
            billingOutcome: 'COMPLETED',
            version: current.version + 1,
          };
      closures[closureId] = { ...next, needsPrice };
      return next;
    },
    retryCareClosure: (closureId, request, idempotencyKey) =>
      replay(idempotencyKey, async () => {
        const closure = closures[closureId];
        if (!closure) throw { code: 'NOT_FOUND' };
        if (
          closure.status === 'CLOSURE_COMPLETED' ||
          closure.version !== request.expectedVersion
        )
          throw {
            code: 'CONFLICT',
            message:
              'El cierre cambió. Actualice su estado antes de reintentar.',
          };
        const retried: CareClosure = {
          id: closure.id,
          clinicalRecordId: closure.clinicalRecordId,
          consultationId: closure.consultationId,
          appointmentId: closure.appointmentId,
          procedureIds: closure.procedureIds,
          manualChargeIds: closure.manualChargeIds,
          appointmentOutcome: closure.appointmentOutcome,
          status: 'CLOSURE_PENDING',
          billingOutcome: 'PENDING',
          version: closure.version + 1,
        };
        closures[closureId] = { ...retried, needsPrice: false };
        return retried;
      }),
    completeProcedure: (procedureId, request, idempotencyKey) =>
      replay(idempotencyKey, async () => {
        const list = Object.values(treatments).find((items) =>
          items.some((item) =>
            item.procedures.some((p) => p.id === procedureId),
          ),
        );
        const current = list?.find((item) =>
          item.procedures.some((p) => p.id === procedureId),
        );
        if (!list || !current) throw { code: 'NOT_FOUND' };
        const procedure = current.procedures.find((p) => p.id === procedureId)!;
        if (
          current.status !== 'IN_PROGRESS' ||
          procedure.status === 'COMPLETED' ||
          current.version !== request.expectedVersion
        )
          throw {
            code: 'CONFLICT',
            message:
              'El estado de la atención no permite completar este procedimiento.',
          };
        list.splice(list.indexOf(current), 1, {
          ...current,
          procedures: current.procedures.map((item) =>
            item.id === procedureId ? { ...item, status: 'COMPLETED' } : item,
          ),
          version: current.version + 1,
        });
        if (request.additionalRequirements.length > 0)
          unpriced.add(procedureId);
        const completion: ProcedureCompletion = {
          procedureId,
          treatmentId: current.id,
          appointmentId: procedure.appointmentId,
          completedAt: new Date().toISOString(),
          version: 2,
        };
        return completion;
      }),
    async listTreatments(patientId) {
      if (!treatments[patientId]) throw { code: 'FORBIDDEN' };
      return treatments[patientId];
    },
    startTreatment: (treatmentId, expectedVersion, idempotencyKey) =>
      replay(idempotencyKey, async () => {
        const list = Object.values(treatments).find((items) =>
          items.some((item) => item.id === treatmentId),
        );
        const current = list?.find((item) => item.id === treatmentId);
        if (!list || !current) throw { code: 'NOT_FOUND' };
        if (current.version !== expectedVersion || current.status !== 'PLANNED')
          throw {
            code: 'CONFLICT',
            message:
              'El tratamiento cambió. Recargue el plan antes de iniciarlo.',
          };
        const started: Treatment = {
          ...current,
          status: 'IN_PROGRESS',
          version: current.version + 1,
        };
        list.splice(list.indexOf(current), 1, started);
        return started;
      }),
    planTreatment: (request, idempotencyKey) =>
      replay(idempotencyKey, async () => {
        const list = treatments[request.patientId];
        if (!list) throw { code: 'FORBIDDEN' };
        const id = `treatment-${request.patientId}-${list.length + 1}`;
        const treatment: Treatment = {
          ...request,
          id,
          status: 'PLANNED',
          procedures: request.procedures.map((item, index) => ({
            ...item,
            id: `${id}-procedure-${index + 1}`,
            status: 'PLANNED',
          })),
          version: 1,
        };
        treatments[request.patientId] = [...list, treatment];
        return treatment;
      }),
    async readPatient(patientId) {
      const patient = patients[patientId];
      if (!patient) throw { code: 'FORBIDDEN' };
      return patient;
    },
    async findRecordId(patientId) {
      const recordId = records[patientId];
      if (!recordId) throw { code: 'FORBIDDEN' };
      return recordId;
    },
    async readEntries(recordId): Promise<ClinicalEntryPage> {
      const data = entries[recordId];
      if (!data)
        throw {
          code: 'NOT_FOUND',
          message: 'El registro clínico no está disponible.',
        };
      return {
        data,
        meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
      };
    },
    async amendEntry(entryId, request, idempotencyKey?: string) {
      if (idempotencyKey && applied.has(idempotencyKey)) return;
      const recordId = Object.keys(entries).find((id) =>
        entries[id].some((entry) => entry.id === entryId),
      );
      const original = recordId
        ? entries[recordId].find((entry) => entry.id === entryId)
        : undefined;
      if (!recordId || !original) throw { code: 'NOT_FOUND' };
      if (closedRecords.has(recordId))
        throw { code: 'CONFLICT', message: closedMessage };
      if (original.version !== request.expectedVersion)
        throw {
          code: 'CONFLICT',
          message:
            'La entrada cambió. Recargue el registro antes de corregirla.',
        };
      entries[recordId] = [
        ...entries[recordId],
        {
          id: `demo-${recordId}-${entries[recordId].length + 1}`,
          recordId,
          kind: original.kind,
          text: request.text,
          amendsEntryId: original.id,
          amendmentReason: request.reason,
          authorId: 'demo-dentist',
          createdAt: '2026-10-08T12:30:00.000Z',
          version: 1,
        },
      ];
      versions[recordId] = version(recordId) + 1;
      if (idempotencyKey) applied.add(idempotencyKey);
    },
    async appendEntry(recordId, request, idempotencyKey?: string) {
      if (idempotencyKey && applied.has(idempotencyKey)) return;
      if (!entries[recordId]) throw { code: 'FORBIDDEN' };
      if (closedRecords.has(recordId))
        throw { code: 'CONFLICT', message: closedMessage };
      const linked = entries[recordId].some(
        (entry) =>
          entry.kind === 'CONSULTATION' && entry.id === request.consultationId,
      );
      if (request.kind === 'DIAGNOSIS' && !linked)
        throw {
          code: 'CONFLICT',
          message: 'La consulta no pertenece a este registro clínico.',
        };
      const entry: ClinicalEntry = {
        id: `demo-${recordId}-${entries[recordId].length + 1}`,
        recordId,
        kind: request.kind,
        text: request.text,
        consultationId: request.consultationId,
        authorId: 'demo-dentist',
        createdAt: '2026-10-08T12:00:00.000Z',
        version: 1,
      };
      entries[recordId] = [...entries[recordId], entry];
      versions[recordId] = version(recordId) + 1;
      if (idempotencyKey) applied.add(idempotencyKey);
    },
    async readRecordVersion(recordId) {
      if (!entries[recordId]) throw { code: 'NOT_FOUND' };
      return version(recordId);
    },
    declareCareCompleted: (recordId, request, idempotencyKey) =>
      replay(idempotencyKey, async () => {
        const linked = entries[recordId]?.some(
          (entry) =>
            entry.kind === 'CONSULTATION' &&
            entry.id === request.consultationId,
        );
        if (
          !linked ||
          closedRecords.has(recordId) ||
          version(recordId) !== request.expectedVersion
        )
          throw {
            code: 'CONFLICT',
            message:
              'La atención no admite la declaración en su estado actual.',
          };
        const patientId = Object.keys(records).find(
          (id) => records[id] === recordId,
        )!;
        closedRecords.add(recordId);
        versions[recordId] = version(recordId) + 1;
        const procedureIds = treatments[patientId].flatMap((treatment) =>
          treatment.procedures
            .filter((procedure) => procedure.status === 'COMPLETED')
            .map((procedure) => procedure.id),
        );
        // ADR-014: the declaration opens the one closure of the encounter.
        const closure: CareClosure = {
          id: `closure-${recordId}`,
          clinicalRecordId: recordId,
          consultationId: request.consultationId,
          appointmentId: request.appointmentId,
          procedureIds,
          manualChargeIds: [],
          status: 'AWAITING_ADMINISTRATIVE_FINALIZATION',
          appointmentOutcome: 'PENDING',
          billingOutcome: 'PENDING',
          version: 1,
        };
        closures[closure.id] = {
          ...closure,
          needsPrice: procedureIds.some((id) => unpriced.has(id)),
        };
        return {
          id: `completion-${recordId}`,
          careClosureId: closure.id,
          clinicalRecordId: recordId,
          consultationId: request.consultationId,
          appointmentId: request.appointmentId,
          patientId,
          dentistId: 'demo-dentist',
          procedureIds,
          manualChargeIds: [],
          completedAt: '2026-10-09T10:00:00.000Z',
        };
      }),
    authorName: (authorId) => authors[authorId] ?? authorId,
  };
}
