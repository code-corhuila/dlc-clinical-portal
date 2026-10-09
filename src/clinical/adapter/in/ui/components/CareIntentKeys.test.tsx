import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CareClosure } from '../../../../model/procedureCompletion';
import { CareClosureTracker } from './CareClosureTracker';
import { CareCompletionCard } from './CareCompletionCard';

const failed: CareClosure = {
  id: 'closure-1',
  procedureId: 'procedure-1',
  appointmentId: 'appointment-1',
  status: 'CLOSURE_FAILED',
  appointmentOutcome: 'COMPLETED',
  billingOutcome: 'PENDING',
  version: 2,
};

describe('care write intents', () => {
  it('reuses the declaration Idempotency-Key when the same intent is retried', async () => {
    const onDeclare = vi.fn().mockRejectedValue({ code: 'UNAVAILABLE' });
    render(
      <CareCompletionCard
        consultations={[{ id: 'consultation-1', label: 'Consulta 1' }]}
        onDeclare={onDeclare}
      />,
    );

    fireEvent.change(screen.getByLabelText('Consulta de la atención'), {
      target: { value: 'consultation-1' },
    });
    const declare = screen.getByRole('button', {
      name: 'Declarar atención clínica completada',
    });
    fireEvent.click(declare);
    await waitFor(() => expect(declare).toBeEnabled());
    fireEvent.click(declare);
    await waitFor(() => expect(onDeclare).toHaveBeenCalledTimes(2));

    const [first, second] = onDeclare.mock.calls;
    expect(first[1]).toEqual(expect.any(String));
    expect(second[1]).toBe(first[1]);
  });

  it('reuses the retry Idempotency-Key for the same failed closure', async () => {
    const onRetry = vi.fn().mockRejectedValue({ code: 'UNAVAILABLE' });
    render(
      <CareClosureTracker
        closures={[failed]}
        procedureLabel={() => 'Limpieza'}
        onRefresh={vi.fn()}
        onRetry={onRetry}
        onChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Motivo del reintento'), {
      target: { value: 'Precio cargado' },
    });
    const retry = screen.getByRole('button', { name: 'Reintentar cierre' });
    fireEvent.click(retry);
    await screen.findByRole('alert');
    fireEvent.click(retry);
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(2));

    const [first, second] = onRetry.mock.calls;
    expect(first[2]).toEqual(expect.any(String));
    expect(second[2]).toBe(first[2]);
  });
});
