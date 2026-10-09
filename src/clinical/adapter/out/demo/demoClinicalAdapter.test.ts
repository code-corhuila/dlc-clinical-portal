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

  it('plans treatments per patient and denies the unassigned patient', async () => {
    const adapter = createDemoClinicalAdapter();
    const before = await adapter.listTreatments('patient-a');

    const planned = await adapter.planTreatment({
      patientId: 'patient-a',
      clinicalReason: 'Dolor agudo',
      procedures: [{ procedureCode: 'D2391', appointmentId: 'appointment-a' }],
    });

    expect(planned).toMatchObject({ status: 'PLANNED', version: 1 });
    expect(planned.procedures[0]).toMatchObject({ status: 'PLANNED' });
    expect(await adapter.listTreatments('patient-a')).toHaveLength(
      before.length + 1,
    );
    expect(await adapter.listTreatments('patient-b')).toEqual([]);
    await expect(
      adapter.planTreatment({ ...planned, patientId: 'patient-c' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(JSON.stringify(planned)).not.toMatch(/price|amount|cost/i);
  });

  it('starts a planned treatment once and rejects stale versions', async () => {
    const adapter = createDemoClinicalAdapter();
    const [planned] = await adapter.listTreatments('patient-a');

    await expect(
      adapter.startTreatment(planned.id, planned.version + 1),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const started = await adapter.startTreatment(planned.id, planned.version);

    expect(started).toMatchObject({
      status: 'IN_PROGRESS',
      version: planned.version + 1,
    });
    expect((await adapter.listTreatments('patient-a'))[0].status).toBe(
      'IN_PROGRESS',
    );
    await expect(
      adapter.startTreatment(started.id, started.version),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      adapter.startTreatment('unknown-treatment', 1),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('amends an entry by appending a linked correction', async () => {
    const adapter = createDemoClinicalAdapter();
    const record = await adapter.findRecordId('patient-a');
    const [original] = (await adapter.readEntries(record)).data;

    await expect(
      adapter.amendEntry(original.id, {
        text: 'Corrección',
        reason: 'Pieza equivocada',
        expectedVersion: original.version + 1,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await adapter.amendEntry(original.id, {
      text: 'Corrección',
      reason: 'Pieza equivocada',
      expectedVersion: original.version,
    });

    const entries = (await adapter.readEntries(record)).data;
    expect(entries[0]).toEqual(original);
    expect(entries.at(-1)).toMatchObject({
      kind: original.kind,
      text: 'Corrección',
      amendsEntryId: original.id,
      amendmentReason: 'Pieza equivocada',
    });
  });

  it('rejects writes to the closed encounter of patient D', async () => {
    const adapter = createDemoClinicalAdapter();
    const record = await adapter.findRecordId('patient-d');
    const [entry] = (await adapter.readEntries(record)).data;

    await expect(
      adapter.appendEntry(record, { kind: 'EVOLUTION', text: 'Tarde' }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'La atención está cerrada; no admite nuevos registros.',
    });
    await expect(
      adapter.amendEntry(entry.id, {
        text: 'Cambio',
        reason: 'Motivo',
        expectedVersion: entry.version,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('completes an in-progress procedure and stores extras without money', async () => {
    const adapter = createDemoClinicalAdapter();
    const [planned] = await adapter.listTreatments('patient-a');
    const procedureId = planned.procedures[0].id;

    await expect(
      adapter.completeProcedure(procedureId, {
        expectedVersion: planned.version,
        materialsUsed: [],
        additionalRequirements: [],
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const started = await adapter.startTreatment(planned.id, planned.version);
    const closure = await adapter.completeProcedure(procedureId, {
      expectedVersion: started.version,
      materialsUsed: [
        {
          sourceRecordId: 'source-1',
          type: 'ADDITIONAL_MATERIAL',
          quantity: '2',
          description: 'Resina',
          clinicalReason: 'Cavidad profunda',
        },
      ],
      additionalRequirements: [],
    });

    expect(closure).toMatchObject({
      procedureId,
      appointmentId: 'appointment-a',
      status: 'CLOSURE_PENDING',
      appointmentOutcome: 'PENDING',
      billingOutcome: 'PENDING',
    });
    const [after] = await adapter.listTreatments('patient-a');
    expect(after.procedures[0].status).toBe('COMPLETED');
    expect(after.version).toBe(started.version + 1);
    expect(JSON.stringify(closure)).not.toMatch(/price|amount|cost/i);
    await expect(
      adapter.completeProcedure(procedureId, {
        expectedVersion: after.version,
        materialsUsed: [],
        additionalRequirements: [],
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
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
