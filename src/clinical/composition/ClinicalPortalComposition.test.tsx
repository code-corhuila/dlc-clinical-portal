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

  it('shows the treatment plan without prices', async () => {
    renderDemo();

    expect(
      await screen.findByRole('heading', {
        name: 'Plan de Tratamiento y Procedimientos',
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Limpieza profunda' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: 'Planificado' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\$|Costo|Total/)).toBeNull();
  });

  it('plans procedures from the catalog without prices', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: 'Limpieza profunda' });
    fireEvent.change(screen.getByLabelText('Motivo clínico'), {
      target: { value: 'Caries en pieza 18' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Resina simple' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Planificar tratamiento' }),
    );

    expect(
      await screen.findByRole('cell', { name: 'Resina simple' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: 'Caries en pieza 18' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\$|Costo|Total/)).toBeNull();
  });

  it('shows a validation message when no procedure is selected', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: 'Limpieza profunda' });
    fireEvent.change(screen.getByLabelText('Motivo clínico'), {
      target: { value: 'Control' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Planificar tratamiento' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Seleccione al menos un procedimiento.',
    );
  });

  it('starts a planned treatment', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: 'Limpieza profunda' });
    expect(
      screen.getByRole('cell', { name: 'Planificado' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );

    expect(
      await screen.findByRole('cell', { name: 'En curso' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Iniciar tratamiento' }),
    ).toBeNull();
  });

  it('completes a started procedure recording a justified extra', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: /Limpieza profunda/ });
    expect(
      screen.queryByRole('button', { name: 'Completar procedimiento' }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Completar procedimiento' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Agregar material o necesidad' }),
    );
    fireEvent.change(screen.getByLabelText('Cantidad'), {
      target: { value: '1.5' },
    });
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Resina adicional' },
    });
    fireEvent.change(screen.getByLabelText('Justificación clínica'), {
      target: { value: 'Cavidad más profunda' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Registrar procedimiento completado',
      }),
    );

    expect(
      await screen.findByText(/Cierre pendiente: Citas y Facturación/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: /Limpieza profunda · Completado/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\$|Costo|Total|Precio/)).toBeNull();
  });

  it('lists recorded extras pending pricing in Billing', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: /Limpieza profunda/ });
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Completar procedimiento' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Agregar material o necesidad' }),
    );
    fireEvent.change(screen.getByLabelText('Cantidad'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Anestesia adicional' },
    });
    fireEvent.change(screen.getByLabelText('Justificación clínica'), {
      target: { value: 'Sensibilidad persistente' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Registrar procedimiento completado',
      }),
    );

    const pending = await screen.findByRole('region', {
      name: 'Extras pendientes de precio en Facturación',
    });
    expect(pending).toHaveTextContent('Anestesia adicional');
    expect(pending).toHaveTextContent('Material adicional');
    expect(pending).toHaveTextContent('Cantidad: 2');
    expect(pending).toHaveTextContent('Limpieza profunda');
    expect(pending).toHaveTextContent('Cita: appointment-a');
    expect(pending).toHaveTextContent(/Ref\.: [0-9a-f-]{36}/);
    expect(pending).not.toHaveTextContent(/\$|Precio:|Total/);
  });

  it('shows no pending pricing list when no extras were recorded', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: /Limpieza profunda/ });
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Completar procedimiento' }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Registrar procedimiento completado',
      }),
    );

    expect(
      await screen.findByText(/Cierre pendiente: Citas y Facturación/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', {
        name: 'Extras pendientes de precio en Facturación',
      }),
    ).toBeNull();
  });

  async function completeProcedure(withNeed: boolean) {
    renderDemo();
    await screen.findByRole('cell', { name: /Limpieza profunda/ });
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Completar procedimiento' }),
    );
    if (withNeed) {
      fireEvent.click(
        screen.getByRole('button', { name: 'Agregar material o necesidad' }),
      );
      fireEvent.change(screen.getByLabelText('Categoría'), {
        target: { value: 'REQUIREMENT' },
      });
      fireEvent.change(screen.getByLabelText('Cantidad'), {
        target: { value: '1' },
      });
      fireEvent.change(screen.getByLabelText('Descripción'), {
        target: { value: 'Anestesia adicional' },
      });
      fireEvent.change(screen.getByLabelText('Justificación clínica'), {
        target: { value: 'Sensibilidad persistente' },
      });
    }
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Registrar procedimiento completado',
      }),
    );
    return screen.findByRole('region', { name: 'Seguimiento del cierre' });
  }

  it('follows a care closure until both outcomes complete', async () => {
    const panel = await completeProcedure(false);

    expect(panel).toHaveTextContent('Cierre pendiente');
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar estado' }));

    expect(await screen.findByText(/Cierre completado/)).toBeInTheDocument();
    expect(panel).toHaveTextContent(
      'Citas: completado · Facturación: completado',
    );
  });

  it('shows a failed closure and retries it with a reason', async () => {
    await completeProcedure(true);
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar estado' }));

    expect(await screen.findByText(/Cierre fallido/)).toBeInTheDocument();
    expect(
      screen.getByText(/Facturación requiere el precio manual de los extras/),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Motivo del reintento'), {
      target: { value: 'Precio registrado en Facturación' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar cierre' }));
    expect(
      await screen.findByText(/Limpieza profunda: Cierre pendiente/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar estado' }));
    expect(await screen.findByText(/Cierre completado/)).toBeInTheDocument();
  });

  it('rejects an extra without clinical justification', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: /Limpieza profunda/ });
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Completar procedimiento' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Agregar material o necesidad' }),
    );
    fireEvent.change(screen.getByLabelText('Cantidad'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Descripción'), {
      target: { value: 'Resina' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Registrar procedimiento completado',
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'justificación clínica',
    );
  });

  it('keeps the plan readable but not editable without write authorization', async () => {
    renderDemo();

    expect(
      await screen.findByRole('cell', { name: 'Limpieza profunda' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Autorización clínica de escritura'));

    expect(
      await screen.findByRole('cell', { name: 'Limpieza profunda' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Planificar tratamiento' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Iniciar tratamiento' }),
    ).toBeNull();
  });

  it('does not show the previous patient plan after switching patients', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: 'Limpieza profunda' });
    fireEvent.change(screen.getByLabelText('Paciente'), {
      target: { value: 'patient-b' },
    });

    expect(
      screen.queryByRole('cell', { name: 'Limpieza profunda' }),
    ).toBeNull();
    expect(
      await screen.findByText('Sin tratamientos planificados.'),
    ).toBeInTheDocument();
  });

  it('hides the treatment plan from a secretary assistant', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: 'Limpieza profunda' });
    fireEvent.change(screen.getByLabelText('Rol'), {
      target: { value: 'SECRETARY_ASSISTANT' },
    });

    expect(
      screen.queryByRole('cell', { name: 'Limpieza profunda' }),
    ).toBeNull();
    expect(
      screen.queryByRole('heading', {
        name: 'Plan de Tratamiento y Procedimientos',
      }),
    ).toBeNull();
  });

  it('amends an entry while preserving the original', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.click(screen.getByRole('button', { name: 'Corregir entrada' }));
    fireEvent.change(screen.getByLabelText('Texto corregido'), {
      target: { value: 'Consulta corregida' },
    });
    fireEvent.change(screen.getByLabelText('Motivo de la corrección'), {
      target: { value: 'Pieza equivocada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar corrección' }));

    expect(
      await screen.findByText(/Motivo: Pieza equivocada/),
    ).toBeInTheDocument();
    const texts = [...document.querySelectorAll('.cr-entry__text')].map(
      (element) => element.textContent,
    );
    expect(texts).toEqual([
      `Texto${consultationEntry.text}`,
      'TextoConsulta corregida',
    ]);
    expect(screen.getByText('Corregida')).toBeInTheDocument();
  });

  it('does not offer corrections without write authorization', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.click(screen.getByLabelText('Autorización clínica de escritura'));

    expect(
      screen.queryByRole('button', { name: 'Corregir entrada' }),
    ).toBeNull();
  });

  it('shows why a closed encounter rejects new entries', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.change(screen.getByLabelText('Paciente'), {
      target: { value: 'patient-d' },
    });
    await screen.findByRole('button', { name: 'Registrar entrada' });
    addEntry('Nota tardía');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La atención está cerrada; no admite nuevos registros.',
    );
  });

  it('declares clinical care complete and then rejects late entries', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.change(screen.getByLabelText('Consulta de la atención'), {
      target: { value: consultationEntry.id },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Declarar atención clínica completada',
      }),
    );

    expect(
      await screen.findByText(/Atención clínica declarada completada/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Finalización administrativa pendiente en Citas/),
    ).toBeInTheDocument();
    addEntry('Nota tardía');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La atención está cerrada',
    );
  });

  it('requires choosing the consultation before declaring', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Declarar atención clínica completada',
      }),
    );

    expect(
      await screen.findByText('Seleccione la consulta de la atención.'),
    ).toBeInTheDocument();
  });

  it('does not let an administrator declare clinical completion', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.change(screen.getByLabelText('Rol'), {
      target: { value: 'ADMINISTRATOR' },
    });

    expect(
      await screen.findByText(
        'Solo el odontólogo asignado declara el cierre clínico.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Declarar atención clínica completada',
      }),
    ).toBeNull();
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
