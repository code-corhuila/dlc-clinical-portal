import { expect, it } from 'vitest';
import { manualChargePath } from './billingNavigation';
const id = '11111111-1111-4111-8111-111111111111';
it('sends exactly four source identifiers without financial or clinical values', () => {
  const path = manualChargePath(id, {
    appointmentId: id,
    procedureId: id,
    sourceRecordId: id,
  });
  const target = new URL(path, 'https://local.invalid');
  expect(target.pathname).toBe('/app/billing/manual-charges/new');
  expect([...target.searchParams.keys()]).toEqual([
    'patientId',
    'appointmentId',
    'procedureId',
    'sourceRecordId',
  ]);
});
it('rejects missing or unsafe source identifiers', () => {
  expect(() =>
    manualChargePath(id, {
      appointmentId: id,
      procedureId: '',
      sourceRecordId: id,
    }),
  ).toThrow();
});
