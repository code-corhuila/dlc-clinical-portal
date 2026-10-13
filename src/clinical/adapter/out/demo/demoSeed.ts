/**
 * Additional synthetic patients for the demo build only: invented people and
 * records, no real data. Each one covers a distinct state of the portal.
 */
import type {
  ClinicalEntry,
  ClinicalEntryKind,
} from '../../../model/clinicalEntry';
import type { PatientForCare } from '../../../model/patientForCare';
import type { Treatment, TreatmentStatus } from '../../../model/treatment';
import { consultationEntry } from '../../../fixtures/clinicalFixtures';

export interface DemoSeedPatient {
  readonly patient: PatientForCare;
  readonly appointmentId?: string;
  readonly entries: readonly ClinicalEntry[];
  readonly treatments: readonly Treatment[];
}

type EntrySeed = readonly [ClinicalEntryKind, string, string];

function seed(
  key: string,
  name: string,
  phone: string,
  entries: readonly EntrySeed[],
  treatment?: {
    readonly reason: string;
    readonly status: TreatmentStatus;
    readonly procedures: readonly (readonly [string, TreatmentStatus])[];
  },
  status: PatientForCare['status'] = 'ACTIVE',
): DemoSeedPatient {
  const patientId = `patient-${key}`;
  const appointmentId = `appointment-${key}`;
  const consultationId = `consultation-${key}`;
  return {
    patient: { id: patientId, name, phone, status, version: 1 },
    appointmentId: status === 'ACTIVE' ? appointmentId : undefined,
    entries: entries.map(([kind, text, createdAt], index) => ({
      id: kind === 'CONSULTATION' ? consultationId : `entry-${key}-${index}`,
      recordId: `record-${key}`,
      kind,
      text,
      authorId: consultationEntry.authorId,
      createdAt,
      version: 1,
      ...(kind === 'DIAGNOSIS' ? { consultationId } : {}),
    })),
    treatments: treatment
      ? [
          {
            id: `treatment-${key}-1`,
            patientId,
            clinicalReason: treatment.reason,
            status: treatment.status,
            procedures: treatment.procedures.map(
              ([procedureCode, procedureStatus], index) => ({
                id: `procedure-${key}-${index + 1}`,
                procedureCode,
                appointmentId,
                status: procedureStatus,
              }),
            ),
            version: 1,
          },
        ]
      : [],
  };
}

const buildSeedPatients = (): readonly DemoSeedPatient[] => [
  seed(
    'e',
    'Valentina Castro Ríos',
    '+57 311 402 1187',
    [
      [
        'CONSULTATION',
        'Consulta por sensibilidad dental generalizada.',
        '2026-09-01T15:00:00.000Z',
      ],
      [
        'DIAGNOSIS',
        'Bruxismo nocturno con desgaste incisal',
        '2026-09-01T15:20:00.000Z',
      ],
      [
        'EVOLUTION',
        'Limpieza realizada; se programa resina en pieza 21.',
        '2026-09-22T16:10:00.000Z',
      ],
    ],
    {
      reason: 'Control de desgaste y restauración',
      status: 'IN_PROGRESS',
      procedures: [
        ['D1110', 'COMPLETED'],
        ['D2391', 'PLANNED'],
      ],
    },
  ),
  seed(
    'f',
    'Santiago Ruiz Morales',
    '+57 315 287 9043',
    [
      ['ALLERGY', 'Alergia a la penicilina.', '2026-08-12T14:00:00.000Z'],
      [
        'ANTECEDENT',
        'Hipertensión arterial controlada.',
        '2026-08-12T14:05:00.000Z',
      ],
      [
        'CONSULTATION',
        'Dolor intenso al masticar en zona inferior izquierda.',
        '2026-08-12T14:15:00.000Z',
      ],
      [
        'DIAGNOSIS',
        'Pulpitis irreversible - Pieza 36',
        '2026-08-12T14:40:00.000Z',
      ],
    ],
    {
      reason: 'Pieza 36 no restaurable',
      status: 'PLANNED',
      procedures: [['D7140', 'PLANNED']],
    },
  ),
  seed(
    'g',
    'Isabella Moreno Díaz',
    '+57 300 845 2210',
    [
      [
        'CONSULTATION',
        'Control semestral sin molestias.',
        '2026-06-03T13:30:00.000Z',
      ],
      [
        'EVOLUTION',
        'Profilaxis completada; higiene oral adecuada.',
        '2026-06-03T14:00:00.000Z',
      ],
    ],
    {
      reason: 'Profilaxis semestral',
      status: 'COMPLETED',
      procedures: [['D1110', 'COMPLETED']],
    },
  ),
  seed(
    'h',
    'Daniel Vargas Pineda',
    '+57 318 774 6352',
    [
      [
        'CONSULTATION',
        'Valoración inicial por fractura de pieza 11.',
        '2025-11-18T15:45:00.000Z',
      ],
      [
        'DIAGNOSIS',
        'Fractura coronaria no complicada - Pieza 11',
        '2025-11-18T16:05:00.000Z',
      ],
    ],
    undefined,
    'INACTIVE',
  ),
  seed('i', 'Camila Ortiz Restrepo', '+57 304 129 5508', []),
  seed(
    'j',
    'Andrés Mejía Cárdenas',
    '+57 312 660 3471',
    [
      [
        'CONSULTATION',
        'Consulta por sangrado de encías y movilidad leve.',
        '2026-07-21T17:00:00.000Z',
      ],
      [
        'DIAGNOSIS',
        'Periodontitis crónica moderada',
        '2026-07-21T17:25:00.000Z',
      ],
      [
        'DIAGNOSIS',
        'Caries interproximal - Pieza 45',
        '2026-07-21T17:30:00.000Z',
      ],
    ],
    {
      reason: 'Restauración pospuesta por tratamiento periodontal',
      status: 'CANCELLED',
      procedures: [['D2391', 'CANCELLED']],
    },
  ),
];

// Pure, so the real build drops the synthetic data when nothing imports it.
export const demoSeedPatients = /* @__PURE__ */ buildSeedPatients();
