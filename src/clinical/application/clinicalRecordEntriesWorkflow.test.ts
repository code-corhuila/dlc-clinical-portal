import { describe, expect, it } from 'vitest';
import type { ClinicalEntryPage } from '../model/clinicalEntry';
import { ClinicalRecordEntriesWorkflow } from './clinicalRecordEntriesWorkflow';

const page = (id: string): ClinicalEntryPage => ({
  data: [
    {
      id,
      recordId: `record-${id}`,
      kind: 'CONSULTATION',
      text: id,
      authorId: 'dentist-1',
      version: 1,
    },
  ],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
});

describe('ClinicalRecordEntriesWorkflow', () => {
  it('resolves the clinical record before reading its entries', async () => {
    const calls: string[] = [];
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async (patientId) => {
        calls.push(`record:${patientId}`);
        return 'record-9';
      },
      readEntries: async (recordId) => {
        calls.push(`entries:${recordId}`);
        return page('entry-9');
      },
    });

    await workflow.load('patient-9');

    expect(calls).toEqual(['record:patient-9', 'entries:record-9']);
    expect(workflow.status).toMatchObject({
      kind: 'ready',
      page: { data: [{ id: 'entry-9' }] },
    });
  });

  it('keeps the newest request when an older read resolves later', async () => {
    let resolveFirst!: (value: ClinicalEntryPage) => void;
    const first = new Promise<ClinicalEntryPage>((resolve) => {
      resolveFirst = resolve;
    });
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async (patientId) => `record-${patientId}`,
      readEntries: async (recordId) =>
        recordId === 'record-first' ? first : page('second'),
    });

    const stale = workflow.load('first');
    await Promise.resolve();
    await workflow.load('second');
    resolveFirst(page('first'));
    await stale;

    expect(workflow.status).toMatchObject({
      kind: 'ready',
      page: { data: [{ id: 'second' }] },
    });
  });

  it('does not read a record when its patient lookup becomes stale', async () => {
    let resolvePatientA!: (value: string) => void;
    const patientA = new Promise<string>((resolve) => {
      resolvePatientA = resolve;
    });
    const reads: string[] = [];
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async (patientId) =>
        patientId === 'patient-a' ? patientA : 'record-b',
      readEntries: async (recordId) => {
        reads.push(recordId);
        return page('entry-b');
      },
    });

    const stale = workflow.load('patient-a');
    await workflow.load('patient-b');
    resolvePatientA('record-a');
    await stale;

    expect(reads).toEqual(['record-b']);
    expect(workflow.status).toMatchObject({
      kind: 'ready',
      page: { data: [{ id: 'entry-b' }] },
    });
  });

  it('maps a null rejection to a safe fallback error', async () => {
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async () => {
        throw null;
      },
      readEntries: async () => page('unreachable'),
    });

    await expect(workflow.load('patient-1')).resolves.toBeUndefined();
    expect(workflow.status).toEqual({
      kind: 'error',
      message: 'No fue posible cargar el registro clínico.',
    });
  });

  it('maps an invalid object message to the safe fallback error', async () => {
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async () => {
        throw { message: { unexpected: true } };
      },
      readEntries: async () => page('unreachable'),
    });

    await expect(workflow.load('patient-1')).resolves.toBeUndefined();
    expect(workflow.status).toEqual({
      kind: 'error',
      message: 'No fue posible cargar el registro clínico.',
    });
  });

  it('replaces a previously loaded narrative with forbidden access', async () => {
    let forbidden = false;
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async () => 'record-1',
      readEntries: async () => {
        if (forbidden) throw { code: 'FORBIDDEN' };
        return page('visible-entry');
      },
    });

    await workflow.load('patient-1');
    forbidden = true;
    await workflow.load('patient-1');

    expect(workflow.status).toEqual({ kind: 'forbidden' });
  });

  it('ignores an older rejected read after a newer successful request', async () => {
    let rejectFirst!: (reason: unknown) => void;
    const first = new Promise<ClinicalEntryPage>((_, reject) => {
      rejectFirst = reject;
    });
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async (patientId) => `record-${patientId}`,
      readEntries: async (recordId) =>
        recordId === 'record-first' ? first : page('second'),
    });

    const stale = workflow.load('first');
    await Promise.resolve();
    await workflow.load('second');
    rejectFirst(new Error('offline'));
    await stale;

    expect(workflow.status).toMatchObject({
      kind: 'ready',
      page: { data: [{ id: 'second' }] },
    });
  });

  it('preserves an empty page from the read port', async () => {
    const empty: ClinicalEntryPage = {
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async () => 'record-empty',
      readEntries: async () => empty,
    });

    await workflow.load('patient-empty');

    expect(workflow.status).toEqual({ kind: 'ready', page: empty });
  });

  it('maps forbidden reads without retaining a previous narrative', async () => {
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async () => 'record-1',
      readEntries: async () => {
        throw { code: 'FORBIDDEN' };
      },
    });

    await workflow.load('patient-1');

    expect(workflow.status).toEqual({ kind: 'forbidden' });
  });

  it('exposes a retryable error when the port cannot read the record', async () => {
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async () => {
        throw new Error('offline');
      },
      readEntries: async () => page('unreachable'),
    });

    await workflow.load('patient-1');

    // C06: technical errors never reach the user; the safe fallback is shown.
    expect(workflow.status).toEqual({
      kind: 'error',
      message: 'No fue posible cargar el registro clínico.',
    });
  });

  it('shows the owner message with its support reference', async () => {
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async () => {
        throw {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Servicio no disponible.',
          traceId: 'trace-1',
        };
      },
      readEntries: async () => ({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
    });

    await workflow.load('p-1');

    expect(workflow.status).toEqual({
      kind: 'error',
      message: 'Servicio no disponible. Referencia: trace-1',
    });
  });

  it('ignores a cancelled request instead of showing an error', async () => {
    const workflow = new ClinicalRecordEntriesWorkflow({
      findRecordId: async () => {
        throw { code: 'CANCELLED' };
      },
      readEntries: async () => ({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
    });

    await workflow.load('p-1');

    expect(workflow.status).toEqual({ kind: 'loading' });
  });
});
