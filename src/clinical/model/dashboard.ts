/**
 * Clinical Analytics dashboard (`ClinicalDashboard`, clinical-service.yaml;
 * ADR-006, HU-CLN-003, Figma 88:1998): read-only projections that never drive
 * operational state. Money is an exact COP decimal string. Upcoming
 * appointments and pending patients are operational data (HU-OPS-001).
 */
export interface DashboardSnapshot {
  readonly asOf: string;
  readonly todayAppointments: {
    readonly count: number;
    readonly deltaVsYesterday: number;
  };
  /** Administrator only; changePercent is absent without a previous month. */
  readonly monthlyRevenue?: {
    readonly amount: string;
    readonly changePercent?: number;
  };
  /** Calendar dates (YYYY-MM-DD) of the current week, Monday to Sunday. */
  readonly weeklyActivity: readonly { day: string; count: number }[];
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Short Spanish weekday of a calendar date (clinic day, no timezone shift). */
export function weekdayLabel(day: string): string {
  return WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()];
}

/** Role scopes from the navigation-map access matrix. */
export type DashboardScope =
  | { readonly scope: 'CLINIC' }
  | { readonly scope: 'PROFESSIONAL'; readonly professionalId: string }
  | { readonly scope: 'ADMINISTRATIVE' };

export const STALE_AFTER_MINUTES = 15;
