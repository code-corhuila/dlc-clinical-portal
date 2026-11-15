import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ClinicalDashboardComposition,
  ClinicalPortalComposition,
} from './ClinicalPortalComposition';

describe('ClinicalPortalComposition without the dlc-front client', () => {
  it('keeps the federation placeholder and no clinical data', () => {
    render(<ClinicalPortalComposition patientId="patient-a" role="DENTIST" />);

    expect(
      screen.getByRole('heading', { name: 'Clinical portal' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('waits for the dlc-front session before reading analytics', () => {
    render(<ClinicalDashboardComposition role="ADMINISTRATOR" />);

    expect(
      screen.getByText(/require the shared session supplied by dlc-front/),
    ).toBeInTheDocument();
  });
});
