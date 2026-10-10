import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type PortalContext } from './entry';

vi.mock('./composition/ClinicalRouteView', () => ({
  ClinicalRouteView: () => {
    throw new Error('Paciente Ana García: render failed');
  },
}));

const route = {
  compositionId: 'composition-1',
  globalPath: '/app/clinical/patient-a',
  basePath: '/app/clinical',
  localPath: '/patient-a',
  query: {},
  fragment: '',
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('Clinical entry failure containment (C07)', () => {
  it('reports a render failure with only the contract code and keeps it inside the host', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reportFailure = vi.fn();
    const outside = document.body.appendChild(document.createElement('nav'));
    outside.textContent = 'Shell menu';
    const host = document.body.appendChild(document.createElement('div'));

    const handle = await mount(host, {
      contractVersion: 1,
      portalId: 'clinical',
      mountId: 'mount-1',
      compositionId: 'composition-1',
      route,
      signal: new AbortController().signal,
      navigation: { request: async () => ({ status: 'applied' }) },
      session: {
        getSnapshot: () => ({ state: 'anonymous', revision: 0, user: null }),
        subscribe: () => () => {},
      },
      http: {},
      reportFailure,
    } as PortalContext);

    expect(reportFailure).toHaveBeenCalledTimes(1);
    expect(reportFailure).toHaveBeenCalledWith({
      code: 'PORTAL_RENDER_FAILED',
    });
    expect(host.textContent).not.toContain('Ana García');
    expect(outside.textContent).toBe('Shell menu');
    await handle.unmount();
    expect(host.childElementCount).toBe(0);
  });
});
