import { describe, expect, it, vi } from 'vitest';
import type { ClinicalRole } from '../model/clinicalAccess';
import type { DashboardSnapshot } from '../model/dashboard';
import { ReadDashboard, type DashboardSnapshotPort } from './readDashboard';

const snapshot: DashboardSnapshot = {
  asOf: '2026-10-09T09:55:00.000Z',
  todayAppointments: { count: 12, deltaVsYesterday: 2 },
  pendingPatients: 4,
  monthlyRevenue: { amount: '14500000.00', changePercent: 15 },
  weeklyActivity: [{ day: 'Lun', count: 8 }],
  upcomingAppointments: [
    {
      id: 'a-1',
      patientName: 'María Jiménez',
      reason: 'Control y limpieza',
      time: '10:00',
      urgent: false,
    },
  ],
};

function port(): DashboardSnapshotPort {
  return { readDashboard: vi.fn().mockResolvedValue(snapshot) };
}

const now = () => new Date('2026-10-09T10:00:00.000Z');

describe('ReadDashboard', () => {
  it('gives the administrator the full clinic dashboard with revenue', async () => {
    const dashboards = port();

    const result = await new ReadDashboard(dashboards, now).execute({
      role: 'ADMINISTRATOR',
      staffId: 'admin-1',
    });

    expect(result.snapshot.monthlyRevenue?.amount).toBe('14500000.00');
    expect(result.stale).toBe(false);
    expect(dashboards.readDashboard).toHaveBeenCalledWith({ scope: 'CLINIC' });
  });

  it('limits a dentist to the professional scope and hides revenue', async () => {
    const dashboards = port();

    const result = await new ReadDashboard(dashboards, now).execute({
      role: 'DENTIST',
      staffId: 'dentist-7',
    });

    expect(dashboards.readDashboard).toHaveBeenCalledWith({
      scope: 'PROFESSIONAL',
      professionalId: 'dentist-7',
    });
    expect(result.snapshot.monthlyRevenue).toBeUndefined();
  });

  it('gives the secretary assistant the administrative scope without revenue', async () => {
    const dashboards = port();

    const result = await new ReadDashboard(dashboards, now).execute({
      role: 'SECRETARY_ASSISTANT',
      staffId: 'assistant-1',
    });

    expect(dashboards.readDashboard).toHaveBeenCalledWith({
      scope: 'ADMINISTRATIVE',
    });
    expect(result.snapshot.monthlyRevenue).toBeUndefined();
  });

  it('denies a missing role before calling the port', async () => {
    const dashboards = port();

    await expect(
      new ReadDashboard(dashboards, now).execute({
        role: null as ClinicalRole | null,
        staffId: 'x',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(dashboards.readDashboard).not.toHaveBeenCalled();
  });

  it('flags data older than 15 minutes as stale', async () => {
    const dashboards = port();
    vi.mocked(dashboards.readDashboard).mockResolvedValue({
      ...snapshot,
      asOf: '2026-10-09T09:40:00.000Z',
    });

    const result = await new ReadDashboard(dashboards, now).execute({
      role: 'ADMINISTRATOR',
      staffId: 'admin-1',
    });

    expect(result.stale).toBe(true);
  });
});
