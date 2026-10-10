import { describe, expect, it } from 'vitest';
import { createDemoClinicalAdapter } from './demoClinicalAdapter';

describe('demoClinicalAdapter', () => {
  it('keeps patient histories isolated and appends a consultation', async () => {
    const adapter = createDemoClinicalAdapter();
    const recordA = await adapter.findRecordId('patient-a');
    const recordB = await adapter.findRecordId('patient-b');

    await adapter.appendEntry(
      recordA,
      {
        kind: 'CONSULTATION',
        text: 'Nueva consulta',
      },
      'k-1',
    );

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
    await adapter.appendEntry(
      record,
      {
        kind: 'EVOLUTION',
        text: 'Seguimiento demo',
      },
      'k-2',
    );

    const after = (await adapter.readEntries(record)).data;
    expect(after).toHaveLength(before.length + 1);
    expect(after[0]).toEqual(before[0]);
  });

  it('keeps separate adapter instances isolated', async () => {
    const first = createDemoClinicalAdapter();
    const second = createDemoClinicalAdapter();
    const record = await first.findRecordId('patient-a');
    await first.appendEntry(
      record,
      { kind: 'CONSULTATION', text: 'Solo A1' },
      'k-3',
    );

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
      adapter.appendEntry(
        'record-c',
        {
          kind: 'CONSULTATION',
          text: 'No autorizado',
        },
        'k-4',
      ),
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
      adapter.appendEntry(
        recordB,
        {
          kind: 'DIAGNOSIS',
          text: 'Cruce de pacientes',
          consultationId: consultation.id,
        },
        'k-5',
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await adapter.appendEntry(
      recordA,
      {
        kind: 'DIAGNOSIS',
        text: 'Caries oclusal',
        consultationId: consultation.id,
      },
      'k-6',
    );

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

    const planned = await adapter.planTreatment(
      {
        patientId: 'patient-a',
        clinicalReason: 'Dolor agudo',
        procedures: [
          { procedureCode: 'D2391', appointmentId: 'appointment-a' },
        ],
      },
      'k-intent-12',
    );

    expect(planned).toMatchObject({ status: 'PLANNED', version: 1 });
    expect(planned.procedures[0]).toMatchObject({ status: 'PLANNED' });
    expect(await adapter.listTreatments('patient-a')).toHaveLength(
      before.length + 1,
    );
    expect(await adapter.listTreatments('patient-b')).toEqual([]);
    await expect(
      adapter.planTreatment(
        { ...planned, patientId: 'patient-c' },
        'k-intent-11',
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(JSON.stringify(planned)).not.toMatch(/price|amount|cost/i);
  });

  it('starts a planned treatment once and rejects stale versions', async () => {
    const adapter = createDemoClinicalAdapter();
    const [planned] = await adapter.listTreatments('patient-a');

    await expect(
      adapter.startTreatment(planned.id, planned.version + 1, 'k-intent-10'),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const started = await adapter.startTreatment(
      planned.id,
      planned.version,
      'k-intent-9',
    );

    expect(started).toMatchObject({
      status: 'IN_PROGRESS',
      version: planned.version + 1,
    });
    expect((await adapter.listTreatments('patient-a'))[0].status).toBe(
      'IN_PROGRESS',
    );
    await expect(
      adapter.startTreatment(started.id, started.version, 'k-intent-8'),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      adapter.startTreatment('unknown-treatment', 1, 'k-intent-7'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('amends an entry by appending a linked correction', async () => {
    const adapter = createDemoClinicalAdapter();
    const record = await adapter.findRecordId('patient-a');
    const [original] = (await adapter.readEntries(record)).data;

    await expect(
      adapter.amendEntry(
        original.id,
        {
          text: 'Corrección',
          reason: 'Pieza equivocada',
          expectedVersion: original.version + 1,
        },
        'k-7',
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await adapter.amendEntry(
      original.id,
      {
        text: 'Corrección',
        reason: 'Pieza equivocada',
        expectedVersion: original.version,
      },
      'k-8',
    );

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
      adapter.appendEntry(record, { kind: 'EVOLUTION', text: 'Tarde' }, 'k-9'),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'La atención está cerrada; no admite nuevos registros.',
    });
    await expect(
      adapter.amendEntry(
        entry.id,
        {
          text: 'Cambio',
          reason: 'Motivo',
          expectedVersion: entry.version,
        },
        'k-10',
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('completes an in-progress procedure and stores extras without money', async () => {
    const adapter = createDemoClinicalAdapter();
    const [planned] = await adapter.listTreatments('patient-a');
    const procedureId = planned.procedures[0].id;

    await expect(
      adapter.completeProcedure(
        procedureId,
        {
          expectedVersion: planned.version,
          materialsUsed: [],
          additionalRequirements: [],
        },
        'k-intent-6',
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const started = await adapter.startTreatment(
      planned.id,
      planned.version,
      'k-intent-5',
    );
    const closure = await adapter.completeProcedure(
      procedureId,
      {
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
      },
      'k-intent-4',
    );

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
      adapter.completeProcedure(
        procedureId,
        {
          expectedVersion: after.version,
          materialsUsed: [],
          additionalRequirements: [],
        },
        'k-intent-3',
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('declares care completion once and then rejects late writes', async () => {
    const adapter = createDemoClinicalAdapter();
    const record = await adapter.findRecordId('patient-a');
    const [consultation] = (await adapter.readEntries(record)).data;
    const version = await adapter.readRecordVersion(record);

    await expect(
      adapter.declareCareCompleted(
        record,
        {
          consultationId: consultation.id,
          appointmentId: 'appointment-a',
          expectedVersion: version + 1,
        },
        'k-declare-1',
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const completion = await adapter.declareCareCompleted(
      record,
      {
        consultationId: consultation.id,
        appointmentId: 'appointment-a',
        expectedVersion: version,
      },
      'k-declare-2',
    );

    expect(completion).toMatchObject({
      clinicalRecordId: record,
      consultationId: consultation.id,
      patientId: 'patient-a',
      manualChargeIds: [],
    });
    await expect(
      adapter.appendEntry(record, { kind: 'EVOLUTION', text: 'Tarde' }, 'k-11'),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      adapter.declareCareCompleted(
        record,
        {
          consultationId: consultation.id,
          appointmentId: 'appointment-a',
          expectedVersion: await adapter.readRecordVersion(record),
        },
        'k-declare-3',
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const fresh = createDemoClinicalAdapter();
    await expect(
      fresh.appendEntry(record, { kind: 'EVOLUTION', text: 'Abierta' }, 'k-12'),
    ).resolves.toBeUndefined();
  });

  it('increments the record version on every write', async () => {
    const adapter = createDemoClinicalAdapter();
    const record = await adapter.findRecordId('patient-b');
    const before = await adapter.readRecordVersion(record);

    await adapter.appendEntry(
      record,
      { kind: 'EVOLUTION', text: 'Control' },
      'k-13',
    );

    expect(await adapter.readRecordVersion(record)).toBe(before + 1);
  });

  async function completeFirstProcedure(withNeed: boolean) {
    const adapter = createDemoClinicalAdapter();
    const [planned] = await adapter.listTreatments('patient-a');
    const started = await adapter.startTreatment(
      planned.id,
      planned.version,
      'k-intent-2',
    );
    const need = {
      sourceRecordId: 'source-1',
      type: 'COMPLEXITY_ADJUSTMENT' as const,
      quantity: '1',
      description: 'Anestesia',
      clinicalReason: 'Sensibilidad',
    };
    const closure = await adapter.completeProcedure(
      started.procedures[0].id,
      {
        expectedVersion: started.version,
        materialsUsed: [],
        additionalRequirements: withNeed ? [need] : [],
      },
      'k-intent-1',
    );
    return { adapter, closure };
  }

  it('converges a closure without manual extras to completed', async () => {
    const { adapter, closure } = await completeFirstProcedure(false);

    expect(await adapter.readCareClosure(closure.id)).toMatchObject({
      status: 'CLOSURE_COMPLETED',
      appointmentOutcome: 'COMPLETED',
      billingOutcome: 'COMPLETED',
    });
  });

  it('fails a closure with unpriced needs until an authorized retry', async () => {
    const { adapter, closure } = await completeFirstProcedure(true);

    const failed = await adapter.readCareClosure(closure.id);
    expect(failed).toMatchObject({
      status: 'CLOSURE_FAILED',
      billingOutcome: 'PENDING',
      failureReason: 'Facturación requiere el precio manual de los extras.',
    });
    await expect(
      adapter.retryCareClosure(
        closure.id,
        {
          reason: 'Precio registrado',
          expectedVersion: failed.version + 1,
        },
        'k-retry-1',
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    const retried = await adapter.retryCareClosure(
      closure.id,
      {
        reason: 'Precio registrado',
        expectedVersion: failed.version,
      },
      'k-retry-2',
    );
    expect(retried).toMatchObject({ status: 'CLOSURE_PENDING' });
    expect(await adapter.readCareClosure(closure.id)).toMatchObject({
      status: 'CLOSURE_COMPLETED',
    });
    await expect(adapter.readCareClosure('unknown')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('serves clinic and professional dashboard snapshots with COP revenue', async () => {
    const adapter = createDemoClinicalAdapter();

    const clinic = await adapter.readDashboard({ scope: 'CLINIC' });
    const own = await adapter.readDashboard({
      scope: 'PROFESSIONAL',
      professionalId: 'demo-dentist',
    });

    expect(clinic.monthlyRevenue?.amount).toMatch(/^\d{1,12}\.\d{2}$/);
    expect(clinic.weeklyActivity).toHaveLength(7);
    expect(own.todayAppointments.count).toBeLessThan(
      clinic.todayAppointments.count,
    );
    expect(own.upcomingAppointments.length).toBeLessThan(
      clinic.upcomingAppointments.length,
    );
  });

  it('applies a repeated write intent only once', async () => {
    const adapter = createDemoClinicalAdapter();
    const record = await adapter.findRecordId('patient-a');
    const before = (await adapter.readEntries(record)).data.length;
    const note = { kind: 'EVOLUTION', text: 'Reintento' } as const;

    await adapter.appendEntry(record, note, 'intent-1');
    await adapter.appendEntry(record, note, 'intent-1');
    await adapter.appendEntry(record, note, 'intent-2');
    const [original] = (await adapter.readEntries(record)).data;
    const amendment = {
      text: 'Corrección',
      reason: 'Motivo',
      expectedVersion: original.version,
    };
    await adapter.amendEntry(original.id, amendment, 'intent-3');
    await adapter.amendEntry(original.id, amendment, 'intent-3');

    expect((await adapter.readEntries(record)).data).toHaveLength(before + 3);
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

  it('replays a repeated care-completion intent without a second effect', async () => {
    const adapter = createDemoClinicalAdapter();
    const record = await adapter.findRecordId('patient-a');
    const [consultation] = (await adapter.readEntries(record)).data;
    const request = {
      consultationId: consultation.id,
      appointmentId: 'appointment-a',
      expectedVersion: await adapter.readRecordVersion(record),
    };

    const first = await adapter.declareCareCompleted(record, request, 'k-dec');
    const replay = await adapter.declareCareCompleted(record, request, 'k-dec');

    expect(replay).toEqual(first);
    expect(await adapter.readRecordVersion(record)).toBe(
      request.expectedVersion + 1,
    );
  });

  it('replays repeated plan, start and completion intents without a second effect', async () => {
    const adapter = createDemoClinicalAdapter();
    const [planned] = await adapter.listTreatments('patient-a');

    const started = await adapter.startTreatment(
      planned.id,
      planned.version,
      'k-start',
    );
    const replayed = await adapter.startTreatment(
      planned.id,
      planned.version,
      'k-start',
    );
    expect(replayed).toEqual(started);

    const request = {
      patientId: 'patient-b',
      clinicalReason: 'Control',
      procedures: [{ procedureCode: 'D1110', appointmentId: 'appointment-b' }],
    };
    await adapter.planTreatment(request, 'k-plan');
    await adapter.planTreatment(request, 'k-plan');
    expect(await adapter.listTreatments('patient-b')).toHaveLength(1);

    const completion = {
      expectedVersion: started.version,
      materialsUsed: [],
      additionalRequirements: [],
    };
    const first = await adapter.completeProcedure(
      started.procedures[0].id,
      completion,
      'k-done',
    );
    const again = await adapter.completeProcedure(
      started.procedures[0].id,
      completion,
      'k-done',
    );
    expect(again).toEqual(first);
  });
});
