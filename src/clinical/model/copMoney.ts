/** Contract `Money`: exact COP decimal string, NUMERIC(14,2); never floats. */
const MONEY = /^\d{1,12}\.\d{2}$/;

function toCents(value: string): number {
  if (!MONEY.test(value)) throw new Error(`Invalid COP amount: ${value}`);
  const [units, cents] = value.split('.');
  return Number(units) * 100 + Number(cents);
}

/** Sums display estimates in integer cents (max NUMERIC(14,2) fits safely). */
export function sumCop(values: readonly string[]): string {
  const cents = values.reduce((total, value) => total + toCents(value), 0);
  return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

/** Formats integer units and appends cents as text: no float arithmetic. */
export function formatCop(value: string): string {
  toCents(value);
  const [units, cents] = value.split('.');
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(units));
  return `${formatted},${cents}`;
}
