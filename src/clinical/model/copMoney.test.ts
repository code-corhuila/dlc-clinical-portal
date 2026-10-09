import { describe, expect, it } from 'vitest';
import { formatCop, sumCop } from './copMoney';

describe('copMoney', () => {
  it('adds exact COP decimals without floating point error', () => {
    expect(sumCop(['0.10', '0.20'])).toBe('0.30');
    expect(sumCop(['180000.00', '150000.00', '220000.00'])).toBe('550000.00');
    expect(sumCop([])).toBe('0.00');
  });

  it('rejects values that are not contract Money', () => {
    expect(() => sumCop(['12.5'])).toThrow();
    expect(() => sumCop(['-1.00'])).toThrow();
  });

  it('formats COP for es-CO readers', () => {
    expect(formatCop('265000.00')).toMatch(/\$\s?265\.000,00/);
  });
});
