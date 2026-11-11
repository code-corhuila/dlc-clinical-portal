import type { Treatment } from './treatment';

/** Prevent the encounter from closing while its own planned work is unfinished. */
export function ensureProceduresReady(treatments: readonly Treatment[], appointmentId: string): void {
  const pending = treatments.flatMap((treatment) => treatment.procedures).filter(
    (procedure) => procedure.appointmentId === appointmentId &&
      (procedure.status === 'PLANNED' || procedure.status === 'IN_PROGRESS'),
  );
  if (pending.length) {
    throw {
      code: 'PENDING_PROCEDURES',
      message: `Hay ${pending.length} procedimiento(s) pendiente(s) en esta cita. Inicie el tratamiento y complete cada procedimiento antes de cerrar la atención.`,
    };
  }
}
