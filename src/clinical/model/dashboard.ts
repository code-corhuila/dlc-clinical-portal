/**
 * Clinical Analytics dashboard snapshot (ADR-006, Figma 88:1998): Clinical
 * projections plus minimized Appointments/Billing facts. Read-only; it never
 * drives operational state. Money is an exact COP decimal string.
 */
export interface DashboardSnapshot {
  readonly asOf: string;
  readonly todayAppointments: {
    readonly count: number;
    readonly deltaVsYesterday: number;
  };
  readonly pendingPatients: number;
  readonly monthlyRevenue?: {
    readonly amount: string;
    readonly changePercent: number;
  };
  readonly weeklyActivity: readonly { day: string; count: number }[];
  readonly upcomingAppointments: readonly {
    readonly id: string;
    readonly patientName: string;
    readonly reason: string;
    readonly time: string;
    readonly urgent: boolean;
  }[];
}

/** Role scopes from the navigation-map access matrix. */
export type DashboardScope =
  | { readonly scope: 'CLINIC' }
  | { readonly scope: 'PROFESSIONAL'; readonly professionalId: string }
  | { readonly scope: 'ADMINISTRATIVE' };

export const STALE_AFTER_MINUTES = 15;
