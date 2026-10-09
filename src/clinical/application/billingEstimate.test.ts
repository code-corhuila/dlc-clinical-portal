import { describe, expect, it, vi } from 'vitest';
import type { ClinicalRole } from '../model/clinicalAccess';
import { BillingEstimate, type ProcedurePricePort } from './billingEstimate';

const prices = [
  {
    procedureCode: 'D1110',
    name: 'Limpieza profunda',
    basePrice: '180000.00',
    currency: 'COP',
    status: 'ACTIVE',
  },
  {
    procedureCode: 'D9999',
    name: 'Retirado',
    basePrice: '1.00',
    currency: 'COP',
    status: 'INACTIVE',
  },
] as const;

function port(): ProcedurePricePort {
  return { listProcedurePrices: vi.fn().mockResolvedValue(prices) };
}

const access = (role: ClinicalRole | null, authorized: boolean) => ({
  role,
  clinicalReadAuthorized: authorized,
});

describe('BillingEstimate', () => {
  it('returns active catalog prices by procedure code', async () => {
    const estimate = await new BillingEstimate(port()).read(
      access('DENTIST', true),
    );

    expect(estimate).toEqual({
      D1110: { name: 'Limpieza profunda', basePrice: '180000.00' },
    });
  });

  it.each<[string, ClinicalRole | null, boolean]>([
    [
      'a secretary assistant in the clinical record',
      'SECRETARY_ASSISTANT',
      true,
    ],
    ['a dentist without clinical read access', 'DENTIST', false],
  ])('does not read prices for %s', async (_, role, authorized) => {
    const billing = port();

    await expect(
      new BillingEstimate(billing).read(access(role, authorized)),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(billing.listProcedurePrices).not.toHaveBeenCalled();
  });
});
