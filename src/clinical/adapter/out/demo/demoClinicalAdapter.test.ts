import { describe, expect, it } from 'vitest';
import { createDemoClinicalAdapter } from './demoClinicalAdapter';

describe('demoClinicalAdapter', () => {
  it('keeps patient histories isolated and appends a consultation', async () => {
    const adapter = createDemoClinicalAdapter();
    const recordA = await adapter.findRecordId('patient-a');
    const recordB = await adapter.findRecordId('patient-b');

    await adapter.appendEntry(recordA, {
      kind: 'CONSULTATION',
      text: 'Nueva consulta',
    });

    expect(
      (await adapter.readEntries(recordA)).data.map((entry) => entry.text),
    ).toContain('Nueva consulta');
    expect(
      (await adapter.readEntries(recordB)).data.map((entry) => entry.text),
    ).not.toContain('Nueva consulta');
  });

  it('appends an evolution without overwriting existing entries', async () => {
    const adapter = createDemoClinicalAdapter();
    const record = await adapter.findRecordId('patient-b');
    const before = (await adapter.readEntries(record)).data;
    await adapter.appendEntry(record, {
      kind: 'EVOLUTION',
      text: 'Seguimiento demo',
    });

    const after = (await adapter.readEntries(record)).data;
    expect(after).toHaveLength(before.length + 1);
    expect(after[0]).toEqual(before[0]);
  });

  it('keeps separate adapter instances isolated', async () => {
    const first = createDemoClinicalAdapter();
    const second = createDemoClinicalAdapter();
    const record = await first.findRecordId('patient-a');
    await first.appendEntry(record, { kind: 'CONSULTATION', text: 'Solo A1' });

    expect(
      (await second.readEntries(record)).data.map((entry) => entry.text),
    ).not.toContain('Solo A1');
  });

  it('rejects reads and writes for the unassigned patient record', async () => {
    const adapter = createDemoClinicalAdapter();

    await expect(adapter.findRecordId('patient-c')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(
      adapter.appendEntry('record-c', {
        kind: 'CONSULTATION',
        text: 'No autorizado',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('serves only the minimized care projection for assigned patients', async () => {
    const adapter = createDemoClinicalAdapter();

    const patient = await adapter.readPatient('patient-a');

    expect(Object.keys(patient).sort()).toEqual(
      ['id', 'name', 'phone', 'status', 'version'].sort(),
    );
    await expect(adapter.readPatient('patient-c')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('links a diagnosis only to a consultation of the same record', async () => {
    const adapter = createDemoClinicalAdapter();
    const recordA = await adapter.findRecordId('patient-a');
    const recordB = await adapter.findRecordId('patient-b');
    const [consultation] = (await adapter.readEntries(recordA)).data;

    await expect(
      adapter.appendEntry(recordB, {
        kind: 'DIAGNOSIS',
        text: 'Cruce de pacientes',
        consultationId: consultation.id,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await adapter.appendEntry(recordA, {
      kind: 'DIAGNOSIS',
      text: 'Caries oclusal',
      consultationId: consultation.id,
    });

    expect((await adapter.readEntries(recordA)).data.at(-1)).toMatchObject({
      kind: 'DIAGNOSIS',
      consultationId: consultation.id,
    });
  });

  it('lists treatments per patient without prices and denies patient C', async () => {
    const adapter = createDemoClinicalAdapter();

    const [treatment] = await adapter.listTreatments('patient-a');

    expect(treatment.procedures[0]).toMatchObject({
      procedureCode: 'D1110',
      status: 'PLANNED',
    });
    expect(await adapter.listTreatments('patient-b')).toEqual([]);
    await expect(adapter.listTreatments('patient-c')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    expect(JSON.stringify(treatment)).not.toMatch(/price|amount|cost/i);
  });

  it('does not report an unknown record as an empty history', async () => {
    const adapter = createDemoClinicalAdapter();

    await expect(adapter.readEntries('record-unknown')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'El registro clínico no está disponible.',
    });
  });

  it('resolves synthetic author names without exposing unknown identifiers differently', () => {
    const adapter = createDemoClinicalAdapter();

    expect(adapter.authorName('a0700000-0000-4000-8000-0000000000d2')).toBe(
      'Dr. Mateo López',
    );
    expect(adapter.authorName('other-author')).toBe('other-author');
  });
});
