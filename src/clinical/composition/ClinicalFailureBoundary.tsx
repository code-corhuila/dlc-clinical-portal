import { Component, type ReactNode } from 'react';

interface Props {
  readonly onFailure: () => void;
  readonly children: ReactNode;
}

/**
 * C07: a rendering failure is reported once with only the contract code; no
 * exception text, user HTML or patient data leaves the portal.
 */
export class ClinicalFailureBoundary extends Component<
  Props,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? (
      <p role="alert" className="portal-placeholder">
        La sección clínica no está disponible.
      </p>
    ) : (
      this.props.children
    );
  }
}
