/**
 * Dates are shown in the configured clinic timezone (scope.md "Time",
 * HU-CLN-003), the same IANA zone as the Clinical API's CLINIC_TIMEZONE.
 */
export const CLINIC_TIME_ZONE =
  import.meta.env.VITE_CLINIC_TIMEZONE || 'America/Bogota';

const format = (
  iso: string,
  options: Intl.DateTimeFormatOptions,
  locale = 'es',
) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: CLINIC_TIME_ZONE,
  }).format(date);
};

/** "02 mar 2026, 09:30" on the clinic clock. */
export const clinicDateTime = (iso: string) =>
  format(iso, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** "23 oct 2026" on the clinic calendar. */
export const clinicDate = (iso: string) =>
  format(iso, { day: '2-digit', month: 'short', year: 'numeric' });

/** "2026-10-23": the clinic calendar day as YYYY-MM-DD. */
export const clinicDay = (iso: string) =>
  // en-CA formats a calendar date as YYYY-MM-DD.
  format(iso, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA');

/** "22:50" on the clinic clock. */
export const clinicTime = (iso: string) =>
  format(iso, { hour: '2-digit', minute: '2-digit', hour12: false });
