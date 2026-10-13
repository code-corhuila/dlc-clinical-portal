import { fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contractVersion, mount, portalId, type PortalContext } from './entry';

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
    vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
    const target = host();

    const handle = await mount(target, context('/patient-b').value);

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
    vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
    const target = host();

    const handle = await mount(target, context('/analytics').value);

    await vi.waitFor(() =>
      expect(target.textContent).toContain(
        'Bienvenida de nuevo, Dra. Valentina Ruiz',
      ),
    );
    expect(target.textContent).not.toContain('Ingresos del mes');
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
    vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
    const target = host();
    const ctx = context('/patient-b');
    let state = 'authenticated';
    const getSnapshot = ctx.value.session.getSnapshot;
    const session = {
      ...ctx.value.session,
      getSnapshot: () =>
        state === 'authenticated'
          ? getSnapshot()
          : { state, revision: 2, user: null },
    };
    const handle = await mount(target, { ...ctx.value, session });
    await vi.waitFor(() =>
      expect(target.textContent).toContain('Mateo Herrera'),
    );

    state = 'expired';
    ctx.listeners.forEach((listener) => listener());

    expect(target.textContent).not.toContain('Mateo Herrera');
    expect(target.textContent).toContain('Sesión no disponible');
    await handle.unmount();
  });

  describe('demo bar inside the compositor', () => {
    it('replaces the patient selector with a back button to the clinical home', async () => {
      vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
      const target = host();
      const ctx = context('/patient-b');

      const handle = await mount(target, ctx.value);
      await vi.waitFor(() =>
        expect(target.textContent).toContain('Mateo Herrera'),
      );

      expect(target.querySelector('select[aria-label="Paciente"]')).toBeNull();
      expect(target.textContent).not.toMatch(/Vista|Autorización clínica/);
      const back = [...target.querySelectorAll('button')].find(
        (button) => button.textContent === 'Volver a Historia clínica',
      )!;
      fireEvent.click(back);
      expect(ctx.value.navigation.request).toHaveBeenCalledWith({
        path: '/app/clinical',
      });
      await handle.unmount();
    });

    it('offers the same back button in the real build', async () => {
      vi.stubEnv('VITE_CLINICAL_DEMO', 'false');
      const target = host();
      const ctx = context('/patient-b');

      const handle = await mount(target, ctx.value);

      expect(
        [...target.querySelectorAll('button')].some(
          (button) => button.textContent === 'Volver a Historia clínica',
        ),
      ).toBe(true);
      await handle.unmount();
    });

    it('shows patient cards on the clinical home and opens the record through the shell', async () => {
      vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
      const target = host();
      const ctx = context('/');

      const handle = await mount(target, ctx.value);
      await vi.waitFor(() =>
        expect(target.querySelectorAll('article').length).toBeGreaterThan(1),
      );
      expect(target.querySelector('select')).toBeNull();
      const card = [...target.querySelectorAll('article')].find((item) =>
        item.textContent?.includes('Ana García Rodríguez'),
      )!;
      fireEvent.click(card.querySelector('button')!);

      expect(ctx.value.navigation.request).toHaveBeenCalledWith({
        path: '/app/clinical/patient-a',
      });
      await handle.unmount();
    });

    it('filters the clinical home from the route query q', async () => {
      vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
      const target = host();
      const ctx = context('/');
      const value = {
        ...ctx.value,
        route: { ...ctx.value.route, query: { q: ['mateo'] } },
      };

      const handle = await mount(target, value);
      await vi.waitFor(() =>
        expect(target.querySelectorAll('article')).toHaveLength(1),
      );
      expect(target.textContent).toContain('Mateo Herrera');
      await handle.unmount();
    });

    it('labels the weekly range and links to Appointments through the shell', async () => {
      vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
      const target = host();
      const ctx = context('/analytics');

      const handle = await mount(target, ctx.value);
      await vi.waitFor(() =>
        expect(target.textContent).toContain('Esta semana'),
      );
      expect(target.textContent).toContain('Actualizado');
      const link = [...target.querySelectorAll('button')].find(
        (button) => button.textContent === 'Ver todas las citas',
      )!;
      fireEvent.click(link);

      expect(ctx.value.navigation.request).toHaveBeenCalledWith({
        path: '/app/appointments/calendar',
      });
      await handle.unmount();
    });

    it('shows only the dashboard on /analytics, without demo selectors', async () => {
      vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
      const target = host();

      const handle = await mount(target, context('/analytics').value);

      await vi.waitFor(() =>
        expect(target.textContent).toContain('Bienvenida'),
      );
      expect(target.querySelector('select')).toBeNull();
      await handle.unmount();
    });
  });
});
