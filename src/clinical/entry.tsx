import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
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

export interface PortalContext {
  readonly contractVersion: number;
  readonly portalId: string;
  readonly mountId: string;
  readonly compositionId: string;
  readonly route: PortalRoute;
  readonly signal: AbortSignal;
  readonly navigation: unknown;
  readonly session: {
    getSnapshot(): SessionSnapshot;
    subscribe(listener: () => void): () => void;
  };
  readonly http: unknown;
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
  const render = () =>
    flushSync(() =>
      root?.render(
        <ClinicalRouteView
          route={route}
          session={context.session.getSnapshot()}
        />,
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
