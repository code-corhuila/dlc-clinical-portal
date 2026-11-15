import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClinicalDialog } from './ClinicalDialog';

describe('ClinicalDialog', () => {
  it('closes with Escape and ignores other keys', () => {
    const onClose = vi.fn();
    render(
      <ClinicalDialog title="Cierre de la atención clínica" onClose={onClose}>
        <p>contenido</p>
      </ClinicalDialog>,
    );

    expect(
      screen.getByRole('dialog', { name: 'Cierre de la atención clínica' }),
    ).toHaveAttribute('aria-modal', 'true');
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
