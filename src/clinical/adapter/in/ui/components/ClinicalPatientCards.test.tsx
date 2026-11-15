import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClinicalPatientCards } from './ClinicalPatientCards';

const patients = [
  {
    id: 'patient-a',
    name: 'Ana García Rodríguez',
    status: 'ACTIVE' as const,
    version: 1,
  },
  {
    id: 'patient-b',
    name: 'Mateo Herrera Gómez',
    status: 'ACTIVE' as const,
    version: 1,
  },
];

describe('ClinicalPatientCards', () => {
  it('offers to open the record of a patient in care who has none yet', async () => {
    const onOpen = vi.fn();
    render(
      <ClinicalPatientCards
        load={async () => [{ ...patients[1], hasRecord: false }]}
        onOpen={onOpen}
      />,
    );

    const card = await screen.findByRole('article');
    expect(within(card).getByText('Sin historia clínica')).toBeInTheDocument();
    fireEvent.click(
      within(card).getByRole('button', { name: 'Abrir historia clínica' }),
    );
    expect(onOpen).toHaveBeenCalledWith('patient-b');
  });

  it('shows one card per patient with a button to open the clinical record', async () => {
    const onOpen = vi.fn();
    render(
      <ClinicalPatientCards load={async () => patients} onOpen={onOpen} />,
    );

    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(
      within(cards[0]).getByRole('heading', { name: 'Ana García Rodríguez' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).toBeNull();

    fireEvent.click(
      within(cards[1]).getByRole('button', { name: 'Ver historia clínica' }),
    );
    expect(onOpen).toHaveBeenCalledWith('patient-b');
  });

  it('filters the cards by name or id from the search field and the route query', async () => {
    render(
      <ClinicalPatientCards
        load={async () => patients}
        onOpen={vi.fn()}
        initialQuery="mateo"
      />,
    );

    expect(await screen.findAllByRole('article')).toHaveLength(1);
    const search = screen.getByRole('searchbox', { name: 'Buscar paciente' });
    expect(search).toHaveValue('mateo');

    fireEvent.change(search, { target: { value: 'patient-a' } });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(
      screen.getByRole('heading', { name: 'Ana García Rodríguez' }),
    ).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(
      screen.getByText('Ningún paciente coincide con la búsqueda.'),
    ).toBeInTheDocument();
  });

  it('shows a retryable error with its reference when loading fails', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce({
        code: 'UNAVAILABLE',
        message: 'Servicio no disponible.',
        traceId: 't-1',
      })
      .mockResolvedValueOnce(patients);
    render(<ClinicalPatientCards load={load} onOpen={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Servicio no disponible. Referencia: t-1',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findAllByRole('article')).toHaveLength(2);
  });
});
