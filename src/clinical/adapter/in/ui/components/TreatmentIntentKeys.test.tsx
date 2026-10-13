import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Treatment } from '../../../../model/treatment';
import { CompleteProcedureForm } from './CompleteProcedureForm';
import { TreatmentPlanCard } from './TreatmentPlanCard';

const planned: Treatment = {
  id: 'treatment-1',
  patientId: 'patient-1',
  clinicalReason: 'Control',
  status: 'PLANNED',
  procedures: [
    {
      id: 'procedure-1',
      procedureCode: 'D1110',
      appointmentId: 'appointment-1',
      status: 'PLANNED',
    },
  ],
  version: 1,
};

const unavailable = { code: 'UNAVAILABLE' };

function renderCard(props: Partial<Parameters<typeof TreatmentPlanCard>[0]>) {
  return render(
    <TreatmentPlanCard
      load={async () => [planned]}
      catalog={[{ code: 'D2391', label: 'Resina simple' }]}
      diagnoses={[]}
      appointmentId="appointment-1"
      {...props}
    />,
  );
}

describe('treatment write intents', () => {
  it('reuses the start Idempotency-Key when the same start is retried', async () => {
    const onStart = vi.fn().mockRejectedValue(unavailable);
    renderCard({ onStart });

    const start = await screen.findByRole('button', {
      name: 'Iniciar tratamiento',
    });
    fireEvent.click(start);
    await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Iniciar tratamiento' }),
    );
    await waitFor(() => expect(onStart).toHaveBeenCalledTimes(2));

    const [first, second] = onStart.mock.calls;
    expect(first[1]).toEqual(expect.any(String));
    expect(second[1]).toBe(first[1]);
  });

  it('reuses the plan Idempotency-Key when the same plan is retried', async () => {
    const onPlan = vi.fn().mockRejectedValue(unavailable);
    renderCard({ onPlan });

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Planificar nuevo tratamiento',
      }),
    );
    fireEvent.change(screen.getByLabelText('Motivo clínico'), {
      target: { value: 'Caries' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Resina simple' }));
    const submit = screen.getByRole('button', {
      name: 'Planificar tratamiento',
    });
    fireEvent.click(submit);
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(onPlan).toHaveBeenCalledTimes(2));

    const [first, second] = onPlan.mock.calls;
    expect(first[1]).toEqual(expect.any(String));
    expect(second[1]).toBe(first[1]);
  });

  it('reuses the completion Idempotency-Key when the same completion is retried', async () => {
    const onComplete = vi.fn().mockRejectedValue(unavailable);
    render(
      <CompleteProcedureForm onComplete={onComplete} onCancel={vi.fn()} />,
    );

    const submit = screen.getByRole('button', {
      name: 'Registrar procedimiento completado',
    });
    fireEvent.click(submit);
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2));

    const [first, second] = onComplete.mock.calls;
    expect(first[1]).toEqual(expect.any(String));
    expect(second[1]).toBe(first[1]);
  });
});
