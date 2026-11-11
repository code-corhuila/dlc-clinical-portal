import { describe, expect, it } from 'vitest';
import { ensureProceduresReady } from './careCompletionReadiness';
import type { Treatment } from './treatment';

const plan = (status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED', appointmentId = 'a'): Treatment => ({
  id: 't', patientId: 'p', status: 'IN_PROGRESS', version: 1,
  procedures: [{ id: 'p', procedureCode: 'P001', appointmentId, status }],
});

describe('care completion readiness', () => {
  it.each(['PLANNED', 'IN_PROGRESS'] as const)('blocks %s procedures for the current appointment', (status) => {
    expect(() => ensureProceduresReady([plan(status)], 'a')).toThrowError();
  });
  it('allows completed, cancelled, future, and empty plans', () => {
    expect(() => ensureProceduresReady([plan('COMPLETED'), plan('CANCELLED'), plan('PLANNED', 'future')], 'a')).not.toThrow();
    expect(() => ensureProceduresReady([], 'a')).not.toThrow();
  });
});
