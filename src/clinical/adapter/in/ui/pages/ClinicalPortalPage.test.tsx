import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  consultationEntry,
  evolutionEntry,
} from '../../../../fixtures/clinicalFixtures';
import { ClinicalPortalPage } from './ClinicalPortalPage';

describe('ClinicalPortalPage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps the federation placeholder without synthetic records by default', () => {
    render(<ClinicalPortalPage />);

    expect(
      screen.getByRole('heading', { name: 'Clinical portal' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    expect(screen.queryByText(evolutionEntry.text)).toBeNull();
    expect(screen.queryByText(/Modo demostraci/)).toBeNull();
  });

  it('shows the synthetic clinical record demo only with the dev flag', () => {
    vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
    render(<ClinicalPortalPage />);

    expect(screen.getByText(consultationEntry.text)).toBeInTheDocument();
    expect(screen.getByText(evolutionEntry.text)).toBeInTheDocument();
    expect(screen.getByText(/Modo demostraci/)).toBeInTheDocument();
  });
});
