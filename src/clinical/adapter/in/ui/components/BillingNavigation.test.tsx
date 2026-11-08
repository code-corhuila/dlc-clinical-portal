import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { TreatmentPlanCard } from './TreatmentPlanCard';

it('opens Billing from a recorded extra using source identifiers only', async () => {
  const onPriceExtra = vi.fn().mockResolvedValue(undefined);
  const treatment = {
    id: 'treatment',
    patientId: 'patient',
    status: 'IN_PROGRESS' as const,
    clinicalReason: 'private reason',
    version: 1,
    procedures: [
      {
        id: 'procedure',
        appointmentId: 'appointment',
        procedureCode: 'D1',
        status: 'IN_PROGRESS' as const,
      },
    ],
  };
  render(
    <TreatmentPlanCard
      load={async () => [treatment]}
      catalog={[{ code: 'D1', label: 'Procedure' }]}
      diagnoses={[]}
      onPriceExtra={onPriceExtra}
      onComplete={async () => ({
        completion: {
          procedureId: 'procedure',
          treatmentId: 'treatment',
          appointmentId: 'appointment',
          completedAt: '2026-11-07T12:00:00Z',
          version: 2,
        },
        extras: [
          {
            sourceRecordId: 'extra',
            type: 'ADDITIONAL_MATERIAL',
            quantity: '1',
            description: 'Material',
            clinicalReason: 'private reason',
          },
        ],
      })}
    />,
  );
  fireEvent.click(
    await screen.findByRole('checkbox', { name: 'Completar Procedure' }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Registrar procedimiento completado' }),
  );
  const link = await screen.findByRole('button', {
    name: 'Registrar precio en Facturación',
  });
  fireEvent.click(link);
  await waitFor(() =>
    expect(onPriceExtra).toHaveBeenCalledWith({
      appointmentId: 'appointment',
      procedureId: 'procedure',
      sourceRecordId: 'extra',
    }),
  );
});
