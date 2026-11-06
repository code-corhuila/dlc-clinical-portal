import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contractVersion, mount, portalId, type PortalContext } from './entry';
import { createInMemoryClinicalAdapter } from './test/inMemoryClinicalAdapter';

const route = (localPath: string) => ({
  compositionId: 'composition-1',
  globalPath: `/app/clinical${localPath}`,
  basePath: '/app/clinical',
  localPath,
  query: {},
  fragment: '',
});

function context(localPath: string, abort = new AbortController()) {
  const listeners = new Set<() => void>();
  return {
    abort,
    listeners,
    value: {
      contractVersion: 1,
      portalId: 'clinical',
      mountId: 'mount-1',
      compositionId: 'composition-1',
      route: route(localPath),
      signal: abort.signal,
      navigation: { request: vi.fn() },
      session: {
        getSnapshot: () => ({
          state: 'authenticated',
          revision: 1,
          user: {
            id: 'staff-1',
            name: 'Dra. Valentina Ruiz',
            roles: ['DENTIST'],
          },
          permissions: [],
          expiresAt: null,
          reason: null,
        }),
        subscribe: (listener: () => void) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      },
      http: { request: vi.fn() },
      reportFailure: vi.fn(),
    } as PortalContext,
  };
}

const host = () => document.body.appendChild(document.createElement('div'));

const listPage = (data: unknown[]) => ({
  data,
  meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
});
const patients: Record<string, string> = {
  'patient-a': 'Ana García Rodríguez',
  'patient-b': 'Mateo Herrera Gómez',
};

/** Mounts the real build for the dentist session over a routed http stub. */
async function mountWith(
  localPath: string,
  query: Record<string, string[]> = {},
  overrides: Partial<PortalContext> = {},
) {
  const snapshot = await createInMemoryClinicalAdapter().readDashboard({
    scope: 'PROFESSIONAL',
    professionalId: 'staff-1',
  });
  const routes: Record<string, unknown> = {
    '/api/v1/clinical-records': listPage(
      Object.keys(patients).map((patientId, index) => ({
        id: `r-${index}`,
        patientId,
        version: 1,
      })),
    ),
    '/api/v1/clinical-analytics/dashboard': snapshot,
  };
  for (const [id, name] of Object.entries(patients))
    routes[`/api/v1/patients/${id}`] = {
      id,
      name,
      status: 'ACTIVE',
      version: 1,
    };
  const request = vi.fn(async ({ path }: { path: string }) => ({
    ok: true,
    status: 200,
    correlationId: 'corr',
    data: routes[path] ?? listPage([]),
  }));
  const target = host();
  const ctx = context(localPath);
  const value = {
    ...ctx.value,
    route: { ...ctx.value.route, query },
    http: { request } as unknown as PortalContext['http'],
    ...overrides,
  };
  const handle = await mount(target, value);
  return { target, handle, navigation: value.navigation, request };
}

afterEach(() => {
  vi.unstubAllEnvs();
  document.body.innerHTML = '';
});

describe('Clinical portal entry (composition contract v1)', () => {
  it('exports the v1 identity without rendering on import', () => {
    expect(portalId).toBe('clinical');
    expect(contractVersion).toBe(1);
    expect(document.body.childElementCount).toBe(0);
  });

  it('mounts the clinical record of the routed patient inside the host', async () => {
    const { target, handle } = await mountWith('/patient-b');

    expect(typeof handle.updateRoute).toBe('function');
    expect(typeof handle.canLeave).toBe('function');
    expect(typeof handle.unmount).toBe('function');
    expect(target.childElementCount).toBeGreaterThan(0);
    expect(
      await vi.waitFor(() => {
        const name = target.textContent ?? '';
        if (!name.includes('Mateo Herrera')) throw new Error('not yet');
        return name;
      }),
    ).toContain('Mateo Herrera');
    await handle.unmount();
  });

  it('mounts Clinical Analytics on /analytics with the session viewer', async () => {
    const { target, handle } = await mountWith('/analytics');

    await vi.waitFor(() =>
      expect(target.textContent).toContain('Citas de hoy'),
    );
    expect(target.textContent).not.toContain('Ingresos del mes');
    // C04: dlc-front owns the Dashboard page (title, greeting, <main>); Clinical
    // contributes only its Analytics area inside it.
    const area = target.querySelector(
      'section[aria-label="Analítica clínica"]',
    );
    expect(area).not.toBeNull();
    expect(target.querySelector('main, h1')).toBeNull();
    expect(target.textContent).not.toContain('Bienvenida de nuevo');
    await handle.unmount();
  });

  it('reads Clinical Analytics through the compositor http', async () => {
    const target = host();
    const ctx = context('/analytics').value;
    const request = vi.fn(async () => ({
      ok: true,
      status: 200,
      correlationId: 'corr',
      data: {
        asOf: '2026-10-23T23:17:48Z',
        todayAppointments: { count: 7, deltaVsYesterday: 1 },
        weeklyActivity: [{ day: '2026-10-19', count: 2 }],
      },
    }));

    const handle = await mount(target, {
      ...ctx,
      http: { request } as unknown as PortalContext['http'],
    });

    await vi.waitFor(() =>
      expect(target.textContent).toContain('Citas de hoy'),
    );
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/clinical-analytics/dashboard' }),
    );
    await handle.unmount();
  });

  it('shows a portal 404 for an unknown local path and recovers on updateRoute', async () => {
    const target = host();

    const handle = await mount(target, context('/a/b/c').value);
    expect(target.textContent).toContain('Página clínica no encontrada');

    await handle.updateRoute(route('/analytics'));
    expect(target.textContent).not.toContain('Página clínica no encontrada');
    await handle.unmount();
  });

  it('unmounts idempotently and when the context signal aborts', async () => {
    const target = host();
    const first = context('/analytics');
    const handle = await mount(target, first.value);

    await handle.unmount();
    await handle.unmount();
    expect(target.childElementCount).toBe(0);
    expect(first.listeners.size).toBe(0);

    const second = context('/analytics');
    await mount(target, second.value);
    second.abort.abort();
    await vi.waitFor(() => expect(target.childElementCount).toBe(0));
  });

  it('allows leaving: Clinical keeps no unsaved draft across navigation', async () => {
    const handle = await mount(host(), context('/analytics').value);

    await expect(handle.canLeave()).resolves.toBe(true);
    await handle.unmount();
  });

  it('attaches its release stylesheet inside the host and removes it on unmount', async () => {
    const target = host();
    const handle = await mount(target, context('/analytics').value);

    const link = target.querySelector('link[rel="stylesheet"]');
    expect(link?.getAttribute('href')).toMatch(/entry.css$/);
    expect(document.head.querySelector('link[href$="entry.css"]')).toBeNull();

    await handle.unmount();
    expect(target.querySelector('link')).toBeNull();
  });

  it('clears private clinical content when the session stops being authenticated', async () => {
    const ctx = context('/patient-b');
    let state = 'authenticated';
    const getSnapshot = ctx.value.session.getSnapshot;
    const session = {
      ...ctx.value.session,
      getSnapshot: () =>
        state === 'authenticated'
          ? getSnapshot()
          : { state, revision: 2, user: null },
    } as PortalContext['session'];
    const { target, handle } = await mountWith('/patient-b', {}, { session });
    await vi.waitFor(() =>
      expect(target.textContent).toContain('Mateo Herrera'),
    );

    state = 'expired';
    ctx.listeners.forEach((listener) => listener());

    expect(target.textContent).not.toContain('Mateo Herrera');
    expect(target.textContent).toContain('Sesión no disponible');
    await handle.unmount();
  });

  describe('shell navigation over the compositor http', () => {
    it('offers a back button from a record to the clinical home', async () => {
      const { target, handle, navigation } = await mountWith('/patient-b');
      await vi.waitFor(() =>
        expect(target.textContent).toContain('Mateo Herrera'),
      );

      expect(target.querySelector('select')).toBeNull();
      const back = [...target.querySelectorAll('button')].find(
        (button) => button.textContent === 'Volver a Historia clínica',
      )!;
      fireEvent.click(back);
      expect(navigation.request).toHaveBeenCalledWith({
        path: '/app/clinical',
      });
      await handle.unmount();
    });

    it('shows patient cards on the clinical home and opens the record through the shell', async () => {
      const { target, handle, navigation } = await mountWith('/');
      await vi.waitFor(() =>
        expect(target.querySelectorAll('article')).toHaveLength(2),
      );
      const card = [...target.querySelectorAll('article')].find((item) =>
        item.textContent?.includes('Ana García Rodríguez'),
      )!;
      fireEvent.click(card.querySelector('button')!);

      expect(navigation.request).toHaveBeenCalledWith({
        path: '/app/clinical/patient-a',
      });
      await handle.unmount();
    });

    it('filters the clinical home from the route query q', async () => {
      const { target, handle } = await mountWith('/', { q: ['mateo'] });
      await vi.waitFor(() =>
        expect(target.querySelectorAll('article')).toHaveLength(1),
      );
      expect(target.textContent).toContain('Mateo Herrera');
      await handle.unmount();
    });

    it('labels the weekly range and links to Appointments through the shell', async () => {
      const { target, handle, navigation } = await mountWith('/analytics');
      await vi.waitFor(() =>
        expect(target.textContent).toContain('Esta semana'),
      );
      expect(target.textContent).toContain('Actualizado');
      expect(target.textContent).toContain('Citas de hoy');
      expect(target.querySelector('select')).toBeNull();
      const link = [...target.querySelectorAll('button')].find(
        (button) => button.textContent === 'Ver todas las citas',
      )!;
      fireEvent.click(link);

      expect(navigation.request).toHaveBeenCalledWith({
        path: '/app/appointments/calendar',
      });
      await handle.unmount();
    });
  });

  describe('Administrator clinical grants come from the session permissions (PAT-003)', () => {
    const page = (data: unknown[]) => ({
      data,
      meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
    });
    const routes: Record<string, unknown> = {
      '/api/v1/patients/p-1': {
        id: 'p-1',
        name: 'Paciente Real',
        status: 'ACTIVE',
        version: 1,
      },
      '/api/v1/clinical-records': page([
        { id: 'r-1', patientId: 'p-1', version: 1 },
      ]),
      '/api/v1/clinical-records/r-1/entries': page([]),
    };

    async function mountAdministrator(permissions: string[]) {
      const target = host();
      const ctx = context('/p-1').value;
      const request = vi.fn(async ({ path }: { path: string }) => ({
        ok: true,
        status: 200,
        correlationId: 'corr',
        data: routes[path] ?? page([]),
      }));
      const handle = await mount(target, {
        ...ctx,
        session: {
          ...ctx.session,
          getSnapshot: () => ({
            state: 'authenticated',
            revision: 1,
            user: {
              id: 'admin-1',
              name: 'Laura Gómez',
              roles: ['ADMINISTRATOR'],
            },
            permissions,
          }),
        },
        http: { request } as unknown as PortalContext['http'],
      });
      return { target, request, handle };
    }

    it('denies the record without the clinical read permission', async () => {
      const { target, request, handle } = await mountAdministrator([]);

      await vi.waitFor(() =>
        expect(target.textContent).toContain('Acceso denegado'),
      );
      expect(request).not.toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.stringContaining('/entries') }),
      );
      await handle.unmount();
    });

    it('reads without write controls when only clinical read is granted', async () => {
      const { target, request, handle } = await mountAdministrator([
        'clinical:read',
      ]);

      await vi.waitFor(() =>
        expect(request).toHaveBeenCalledWith(
          expect.objectContaining({
            path: '/api/v1/clinical-records/r-1/entries',
          }),
        ),
      );
      await vi.waitFor(() =>
        expect(target.textContent).toContain('Paciente Real'),
      );
      expect(target.textContent).not.toContain('Acceso denegado');
      for (const name of ['Nueva entrada', 'Planificar nuevo tratamiento'])
        expect(target.textContent).not.toContain(name);
      await handle.unmount();
    });

    it('uses the configured permission names, like the Clinical API', async () => {
      vi.stubEnv('VITE_CLINICAL_READ_PERMISSION', 'records:clinical-read');
      const { target, handle } = await mountAdministrator(['clinical:read']);

      await vi.waitFor(() =>
        expect(target.textContent).toContain('Acceso denegado'),
      );
      await handle.unmount();
    });
  });
});
