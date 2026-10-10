import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import type { PortalHttp } from './adapter/out/http/portalHttp';
import { ClinicalFailureBoundary } from './composition/ClinicalFailureBoundary';
import { ClinicalRouteView } from './composition/ClinicalRouteView';

/** Composition contract v1 (dlc-docs 05-architecture/frontend-composition.md, C01-C04). */
export const portalId = 'clinical';
export const contractVersion = 1;

export interface PortalRoute {
  readonly compositionId: string;
  readonly globalPath: string;
  readonly basePath: string;
  readonly localPath: string;
  readonly query: Readonly<Record<string, readonly string[]>>;
  readonly fragment: string;
}

export interface SessionSnapshot {
  readonly state: string;
  readonly revision: number;
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly roles: readonly string[];
  } | null;
}

/** C04: the only way a portal changes the global URL. */
export interface PortalNavigation {
  request(target: {
    path: string;
    replace?: boolean;
  }): Promise<{ status: string }>;
}

export interface PortalContext {
  readonly contractVersion: number;
  readonly portalId: string;
  readonly mountId: string;
  readonly compositionId: string;
  readonly route: PortalRoute;
  readonly signal: AbortSignal;
  readonly navigation: PortalNavigation;
  readonly session: {
    getSnapshot(): SessionSnapshot;
    subscribe(listener: () => void): () => void;
  };
  readonly http: PortalHttp;
  readonly reportFailure: (failure: { code: string }) => void;
}

export interface PortalHandle {
  updateRoute(route: PortalRoute): Promise<void>;
  canLeave(): Promise<boolean>;
  unmount(): Promise<void>;
}

/** Creates the React root inside the compositor's host (C02, C03). */
export async function mount(
  host: HTMLElement,
  context: PortalContext,
): Promise<PortalHandle> {
  // Styles stay inside the host (C03); the sibling entry.css ships with the release.
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('./entry.css', import.meta.url).href;
  const frame = document.createElement('div');
  frame.className = 'cl-portal';
  host.append(stylesheet, frame);
  let root: Root | null = createRoot(frame);
  let route = context.route;
  let reported = false;
  // C07: report once with the contract code only; the compositor ends the mount.
  const onFailure = () => {
    if (reported || context.signal.aborted) return;
    reported = true;
    context.reportFailure({ code: 'PORTAL_RENDER_FAILED' });
  };
  const render = () =>
    flushSync(() =>
      root?.render(
        <ClinicalFailureBoundary onFailure={onFailure}>
          <ClinicalRouteView
            route={route}
            navigation={context.navigation}
            http={context.http}
            session={context.session.getSnapshot()}
          />
        </ClinicalFailureBoundary>,
      ),
    );
  const unsubscribe = context.session.subscribe(render);
  const unmount = async () => {
    if (!root) return;
    unsubscribe();
    context.signal.removeEventListener('abort', unmount);
    const current = root;
    root = null;
    current.unmount();
    frame.remove();
    stylesheet.remove();
  };
  context.signal.addEventListener('abort', unmount);
  try {
    render();
  } catch (error) {
    await unmount();
    throw error;
  }
  return {
    async updateRoute(next) {
      route = next;
      render();
    },
    async canLeave() {
      return true;
    },
    unmount,
  };
}
