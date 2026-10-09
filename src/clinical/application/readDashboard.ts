import type { ClinicalRole } from '../model/clinicalAccess';
import {
  STALE_AFTER_MINUTES,
  type DashboardScope,
  type DashboardSnapshot,
} from '../model/dashboard';

/** Host-provided analytics boundary; it deliberately contains no HTTP details. */
export interface DashboardSnapshotPort {
  readDashboard(scope: DashboardScope): Promise<DashboardSnapshot>;
}

/**
 * Applies the dashboard access matrix: Administrator "Full", Dentist
 * "Professional scope", Secretary Assistant "Administrative scope".
 * Confidential revenue is visible to the Administrator only.
 */
export class ReadDashboard {
  constructor(
    private readonly port: DashboardSnapshotPort,
    private readonly now: () => Date,
  ) {}

  async execute(viewer: {
    readonly role: ClinicalRole | null;
    readonly staffId: string;
  }): Promise<{ snapshot: DashboardSnapshot; stale: boolean }> {
    const scope: DashboardScope | undefined =
      viewer.role === 'ADMINISTRATOR'
        ? { scope: 'CLINIC' }
        : viewer.role === 'DENTIST'
          ? { scope: 'PROFESSIONAL', professionalId: viewer.staffId }
          : viewer.role === 'SECRETARY_ASSISTANT'
            ? { scope: 'ADMINISTRATIVE' }
            : undefined;
    if (!scope) throw { code: 'FORBIDDEN' };

    const data = await this.port.readDashboard(scope);
    const ageMinutes =
      (this.now().getTime() - new Date(data.asOf).getTime()) / 60000;
    return {
      snapshot:
        viewer.role === 'ADMINISTRATOR'
          ? data
          : { ...data, monthlyRevenue: undefined },
      stale: ageMinutes > STALE_AFTER_MINUTES,
    };
  }
}
