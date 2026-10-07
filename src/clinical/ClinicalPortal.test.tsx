import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClinicalPortal } from './ClinicalPortal';

describe('ClinicalPortal', () => {
  it('renders the Clinical portal foundation placeholder', () => {
    render(<ClinicalPortal />);

    expect(
      screen.getByRole('heading', { name: 'Clinical portal' }),
    ).toBeInTheDocument();
  });
});
