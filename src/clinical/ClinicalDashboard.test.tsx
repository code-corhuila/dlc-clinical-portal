import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClinicalDashboard } from './ClinicalDashboard';

describe('ClinicalDashboard (federated entry for /app/dashboard)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('waits for the dlc-front session outside the demo, without synthetic data', () => {
    render(<ClinicalDashboard />);

    expect(
      screen.getByText(/shared session supplied by dlc-front/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/14\.500\.000/)).toBeNull();
  });

  it('renders the synthetic dashboard only with the dev demo flag', async () => {
    vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
    render(<ClinicalDashboard />);

    expect(
      await screen.findByRole('heading', { name: 'Panel' }),
    ).toBeInTheDocument();
  });
});
