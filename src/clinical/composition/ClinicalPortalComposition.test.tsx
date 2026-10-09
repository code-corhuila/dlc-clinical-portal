import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  consultationEntry,
  evolutionEntry,
} from '../fixtures/clinicalFixtures';
import { ClinicalPortalComposition } from './ClinicalPortalComposition';

function renderDemo() {
  vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
  render(<ClinicalPortalComposition />);
}

function addEntry(text: string) {
  fireEvent.change(screen.getByLabelText('Narrativa clínica'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
}

describe('ClinicalPortalComposition', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps the federation placeholder without synthetic records by default', () => {
    render(<ClinicalPortalComposition />);

    expect(
      screen.getByRole('heading', { name: 'Clinical portal' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    expect(screen.queryByText(/Modo demostraci/)).toBeNull();
  });

  it('shows the synthetic clinical record demo only with the dev flag', async () => {
    renderDemo();

    expect(await screen.findByText(consultationEntry.text)).toBeInTheDocument();
    expect(screen.getByText(/Modo demostraci/)).toBeInTheDocument();
    expect(screen.getAllByText('Dra. Valentina Ruiz').length).toBeGreaterThan(
      0,
    );
  });

  it('switches demo patients and appends a consultation to the selected history', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.change(screen.getByLabelText('Paciente'), {
      target: { value: 'patient-b' },
    });
    expect(await screen.findByText(evolutionEntry.text)).toBeInTheDocument();
    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    fireEvent.change(screen.getByLabelText('Paciente'), {
      target: { value: 'patient-a' },
    });
    await screen.findByText(consultationEntry.text);
    addEntry('Consulta agregada');
    expect(await screen.findByText('Consulta agregada')).toBeInTheDocument();
  });

  it('appends an evolution to patient A without replacing its consultation', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.change(screen.getByLabelText('Tipo de entrada'), {
      target: { value: 'EVOLUTION' },
    });
    addEntry('Evolución agregada');

    expect(await screen.findByText('Evolución agregada')).toBeInTheDocument();
    expect(screen.getByText(consultationEntry.text)).toBeInTheDocument();
  });

  it('records a diagnosis linked to the selected consultation', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.change(screen.getByLabelText('Tipo de entrada'), {
      target: { value: 'DIAGNOSIS' },
    });
    fireEvent.change(screen.getByLabelText('Consulta asociada'), {
      target: {
        value: screen
          .getAllByRole('option', { name: /Consulta sintética/ })[0]
          .getAttribute('value'),
      },
    });
    addEntry('Caries oclusal profunda');

    expect(
      await screen.findByText('Caries oclusal profunda'),
    ).toBeInTheDocument();
    expect(screen.getByText('Diagnóstico')).toBeInTheDocument();
  });

  it('adds a quick evolution note from the Evolución card', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    expect(
      screen.getByRole('heading', { name: 'Evolución' }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nota rápida'), {
      target: { value: 'Control sin dolor' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar nota' }));

    expect(await screen.findByText('Control sin dolor')).toBeInTheDocument();
    expect(screen.getByLabelText('Nota rápida')).toHaveValue('');
    expect(screen.getByText(consultationEntry.text)).toBeInTheDocument();
  });

  it('hides the quick note without write authorization', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.click(screen.getByLabelText('Autorización clínica de escritura'));

    expect(screen.queryByLabelText('Nota rápida')).toBeNull();
  });

  it('keeps read access while write authorization is withdrawn', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.click(screen.getByLabelText('Autorización clínica de escritura'));

    expect(screen.getByText(consultationEntry.text)).toBeInTheDocument();
    expect(screen.getByText('Acceso no autorizado')).toBeInTheDocument();
    expect(screen.queryByLabelText('Narrativa clínica')).toBeNull();
  });

  it('does not grant writing when only read authorization is withdrawn', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.click(screen.getByLabelText('Autorización clínica de lectura'));

    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
    expect(screen.queryByLabelText('Narrativa clínica')).toBeNull();
  });

  it('shows the synthetic patient header and switches it with the patient', async () => {
    renderDemo();

    expect(
      await screen.findByRole('heading', { name: 'Ana García Rodríguez' }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Paciente'), {
      target: { value: 'patient-b' },
    });
    expect(
      await screen.findByRole('heading', { name: 'Mateo Herrera Gómez' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Ana García Rodríguez')).toBeNull();
  });

  it('denies the unassigned patient C for reading and writing', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.change(screen.getByLabelText('Paciente'), {
      target: { value: 'patient-c' },
    });

    expect(await screen.findByText('Acceso denegado')).toBeInTheDocument();
    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    expect(screen.queryByLabelText('Narrativa clínica')).toBeNull();
    expect(screen.queryByText('Ana García Rodríguez')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nueva entrada' })).toBeNull();
  });

  it('denies the secretary assistant clinical reading and writing', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.change(screen.getByLabelText('Rol'), {
      target: { value: 'SECRETARY_ASSISTANT' },
    });

    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
    expect(screen.queryByLabelText('Narrativa clínica')).toBeNull();
  });

  it('lets an administrator read without writing when write is not granted', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.change(screen.getByLabelText('Rol'), {
      target: { value: 'ADMINISTRATOR' },
    });
    fireEvent.click(screen.getByLabelText('Autorización clínica de escritura'));

    expect(await screen.findByText(consultationEntry.text)).toBeInTheDocument();
    expect(screen.getByText('Acceso no autorizado')).toBeInTheDocument();
  });
});
