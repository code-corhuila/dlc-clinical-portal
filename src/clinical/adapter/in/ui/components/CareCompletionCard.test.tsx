import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CareCompletionCard } from './CareCompletionCard';

describe('CareCompletionCard', () => {
  it('shows the declaration time on the clinic clock', async () => {
    const onDeclare = vi.fn(async () => ({
      careClosureId: 'cl-1',
      clinicalRecordId: 'r-1',
      consultationId: 'c-1',
      appointmentId: 'ap-1',
      procedureIds: ['p-1'],
      completedAt: '2026-10-24T03:50:00Z',
    }));
    render(
      <CareCompletionCard
        consultations={[{ id: 'c-1', label: '2026-10-23 · Dolor' }]}
        onDeclare={onDeclare as never}
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'c-1' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Declarar atención clínica completada',
      }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'declarada completada el 23 oct 2026, 22:50',
    );
  });
});
