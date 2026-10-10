import { fireEvent, within, render, screen } from '@testing-library/react';
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

/** The new-entry form lives in a dialog opened from the patient header. */
function openComposer() {
  if (!screen.queryByLabelText('Narrativa clínica'))
    fireEvent.click(screen.getByRole('button', { name: 'Nueva entrada' }));
}

function addEntry(text: string) {
  openComposer();
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

  it('enables synthetic data in the explicit demo build for dlc-front', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('MODE', 'demo');
    vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
    render(<ClinicalPortalComposition />);

    expect(await screen.findByText(consultationEntry.text)).toBeInTheDocument();
    expect(screen.getByText(/Modo demostraci/)).toBeInTheDocument();
  });

  it('keeps a normal production build free of synthetic data even with the flag', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
    render(<ClinicalPortalComposition />);

    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Clinical portal' }),
    ).toBeInTheDocument();
  });

  it('starts from the patient and role supplied by the dlc-front shell', async () => {
    vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
    const { rerender } = render(
      <ClinicalPortalComposition patientId="patient-b" role="ADMINISTRATOR" />,
    );

    expect(
      await screen.findByRole('heading', { name: 'Mateo Herrera Gómez' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Rol')).toHaveValue('ADMINISTRATOR');

    rerender(
      <ClinicalPortalComposition patientId="patient-a" role="DENTIST" />,
    );
    expect(
      await screen.findByRole('heading', { name: 'Ana García Rodríguez' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Rol')).toHaveValue('DENTIST');
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
    expect(
      await screen.findByText('Consulta agregada', {
        selector: '.cr-entry__text',
      }),
    ).toBeInTheDocument();
  });

  it('appends an evolution to patient A without replacing its consultation', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    openComposer();
    fireEvent.change(screen.getByLabelText('Tipo de entrada'), {
      target: { value: 'EVOLUTION' },
    });
    addEntry('Evolución agregada');

    expect(
      await screen.findByText('Evolución agregada', {
        selector: '.cr-entry__text',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(consultationEntry.text)).toBeInTheDocument();
  });

  it('records a diagnosis linked to the selected consultation', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    openComposer();
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
      await screen.findByText('Caries oclusal profunda', {
        selector: '.cr-entry__text',
      }),
    ).toBeInTheDocument();
    // Two seeded diagnoses plus the new one.
    expect(
      screen.getAllByText('Diagnóstico', { selector: '.cr-entry__kind' }),
    ).toHaveLength(3);
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
    expect(screen.getByText('Estado: Planificado')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Precio|Costo|Valor/)).toBeNull();
  });

  it('plans procedures from the catalog without prices', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: 'Limpieza profunda' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Planificar nuevo tratamiento' }),
    );
    fireEvent.change(screen.getByLabelText('Motivo clínico'), {
      target: { value: 'Caries en pieza 18' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Resina simple' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Planificar tratamiento' }),
    );

    expect(
      await screen.findByRole('cell', { name: /Caries en pieza 18/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: 'Resina simple' })).toHaveLength(
      2,
    );
    expect(screen.queryByLabelText(/Precio|Costo|Valor/)).toBeNull();
  });

  it('shows a validation message when no procedure is selected', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: 'Limpieza profunda' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Planificar nuevo tratamiento' }),
    );
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
    expect(screen.getByText('Estado: Planificado')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );

    expect(await screen.findByText('Estado: En curso')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Iniciar tratamiento' }),
    ).toBeNull();
  });

  it('completes a started procedure recording a justified extra', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: /^Limpieza profunda/ });
    expect(
      screen.getByRole('checkbox', { name: 'Completar Limpieza profunda' }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Completar Limpieza profunda',
      }),
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
    const done = screen.getByRole('checkbox', {
      name: 'Completar Limpieza profunda',
    });
    expect(done).toBeChecked();
    expect(done).toBeDisabled();
    expect(screen.queryByLabelText(/Precio|Costo|Valor/)).toBeNull();
  });

  it('lists recorded extras pending pricing in Billing', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: /^Limpieza profunda/ });
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Completar Limpieza profunda',
      }),
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

    await screen.findByRole('cell', { name: /^Limpieza profunda/ });
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Completar Limpieza profunda',
      }),
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
    await screen.findByRole('cell', { name: /^Limpieza profunda/ });
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Completar Limpieza profunda',
      }),
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

  it('shows the closure notice and follow-up below the plan table', async () => {
    const panel = await completeProcedure(false);

    const table = screen.getByRole('table');
    const notice = screen.getByText(/Cierre pendiente: Citas y Facturación/);
    const follows = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(table.compareDocumentPosition(notice) & follows).toBeTruthy();
    expect(table.compareDocumentPosition(panel) & follows).toBeTruthy();
  });

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

    await screen.findByRole('cell', { name: /^Limpieza profunda/ });
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );
    fireEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Completar Limpieza profunda',
      }),
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

  it('shows a read-only Billing estimate in COP for planned procedures', async () => {
    renderDemo();

    const plan = await screen.findByRole('region', {
      name: 'Plan de Tratamiento y Procedimientos',
    });
    await screen.findByRole('cell', { name: /180\.000,00/ });
    expect(
      screen.getByRole('columnheader', { name: 'Costo (COP)' }),
    ).toBeInTheDocument();
    expect(plan).toHaveTextContent(/Total estimado.*550\.000,00/);
    expect(plan).toHaveTextContent('Valores de solo lectura de Facturación');
    expect(screen.queryByLabelText(/Precio|Costo|Valor/)).toBeNull();
  });

  it('opens the new entry dialog from the header and closes it after saving', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    expect(screen.queryByLabelText('Narrativa clínica')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva entrada' }));
    expect(
      screen.getByRole('dialog', { name: 'Nueva entrada clínica' }),
    ).toBeInTheDocument();
    addEntry('Consulta desde el diálogo');

    expect(
      await screen.findByText('Consulta desde el diálogo', {
        selector: '.cr-entry__text',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes the new entry dialog without saving', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva entrada' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('prints the treatment plan', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    renderDemo();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Imprimir plan' }),
    );

    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });

  it('filters the Evolución timeline by entry type', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.change(screen.getByLabelText('Nota rápida'), {
      target: { value: 'Control sin dolor' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar nota' }));
    await screen.findByText('Control sin dolor', {
      selector: '.cr-entry__text',
    });

    fireEvent.change(screen.getByLabelText('Filtrar evolución'), {
      target: { value: 'EVOLUTION' },
    });
    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    expect(
      screen.getByText('Control sin dolor', { selector: '.cr-entry__text' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filtrar evolución'), {
      target: { value: 'ALL' },
    });
    expect(screen.getByText(consultationEntry.text)).toBeInTheDocument();
  });

  it('shows the current treatment status in the plan header', async () => {
    renderDemo();

    const plan = await screen.findByRole('region', {
      name: 'Plan de Tratamiento y Procedimientos',
    });
    expect(await screen.findByText('Estado: Planificado')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Iniciar tratamiento' }),
    );

    expect(await screen.findByText('Estado: En curso')).toBeInTheDocument();
    expect(plan).toContainElement(screen.getByText('Estado: En curso'));
  });

  it('shows when each diagnosis was detected', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    openComposer();
    fireEvent.change(screen.getByLabelText('Tipo de entrada'), {
      target: { value: 'DIAGNOSIS' },
    });
    fireEvent.change(screen.getByLabelText('Consulta asociada'), {
      target: { value: consultationEntry.id },
    });
    addEntry('Caries oclusal profunda');

    const card = await screen.findByRole('region', {
      name: 'Diagnósticos Activos',
    });
    expect(
      await screen.findByText(/Detectado: 08 oct 2026/),
    ).toBeInTheDocument();
    expect(card).toHaveTextContent('Consulta del 2026-03-02');
  });

  it('keeps the planning form closed until requested', async () => {
    renderDemo();

    await screen.findByRole('cell', { name: 'Limpieza profunda' });

    expect(screen.queryByLabelText('Motivo clínico')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Planificar nuevo tratamiento' }),
    );
    expect(screen.getByLabelText('Motivo clínico')).toBeInTheDocument();
  });

  it('lists recorded diagnoses in the side column card', async () => {
    renderDemo();

    const card = await screen.findByRole('region', {
      name: 'Diagnósticos Activos',
    });
    expect(card).toHaveTextContent('Gingivitis leve localizada');
    openComposer();
    fireEvent.change(screen.getByLabelText('Tipo de entrada'), {
      target: { value: 'DIAGNOSIS' },
    });
    fireEvent.change(screen.getByLabelText('Consulta asociada'), {
      target: { value: consultationEntry.id },
    });
    addEntry('Caries oclusal profunda');

    await screen.findByText('Caries oclusal profunda', {
      selector: '.dx-card li strong',
    });
    expect(card).toHaveTextContent('Consulta del');
  });

  it('hides diagnoses from a secretary assistant', async () => {
    renderDemo();

    await screen.findByRole('region', { name: 'Diagnósticos Activos' });
    fireEvent.change(screen.getByLabelText('Rol'), {
      target: { value: 'SECRETARY_ASSISTANT' },
    });

    expect(
      screen.queryByRole('region', { name: 'Diagnósticos Activos' }),
    ).toBeNull();
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
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Corregir entrada' })[0],
    );
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
    expect(texts).toEqual(
      expect.arrayContaining([
        `Texto${consultationEntry.text}`,
        'TextoConsulta corregida',
      ]),
    );
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
    await screen.findByRole('button', { name: 'Nueva entrada' });
    addEntry('Nota tardía');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La atención está cerrada; no admite nuevos registros.',
    );
  });

  it('declares clinical care complete and then rejects late entries', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Declarar atención completada',
      }),
    );
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
      await screen.findByRole('button', {
        name: 'Declarar atención completada',
      }),
    );
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

    await screen.findByRole('cell', { name: /^Limpieza profunda/ });
    expect(
      screen.queryByRole('button', { name: 'Declarar atención completada' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', {
        name: 'Declarar atención clínica completada',
      }),
    ).toBeNull();
  });

  function openDashboard(role?: string) {
    renderDemo();
    if (role)
      fireEvent.change(screen.getByLabelText('Rol'), {
        target: { value: role },
      });
    fireEvent.change(screen.getByLabelText('Vista'), {
      target: { value: 'dashboard' },
    });
  }

  it('shows the administrator dashboard with revenue in COP', async () => {
    openDashboard('ADMINISTRATOR');

    expect(
      await screen.findByRole('heading', { name: 'Panel' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bienvenida de nuevo/)).toBeInTheDocument();
    const today = screen.getByRole('region', { name: 'Citas de hoy' });
    expect(today).toHaveTextContent('12');
    expect(
      screen.getByRole('region', { name: 'Ingresos del mes' }),
    ).toHaveTextContent(/14\.500\.000,00/);
    expect(
      screen.getByRole('region', { name: 'Próximas citas' }),
    ).toHaveTextContent('María Jiménez');
    expect(screen.queryByText(consultationEntry.text)).toBeNull();
  });

  it('hides revenue and narrows the dentist dashboard to own scope', async () => {
    openDashboard('DENTIST');

    const today = await screen.findByRole('region', { name: 'Citas de hoy' });
    expect(today).toHaveTextContent('5');
    expect(
      screen.queryByRole('region', { name: 'Ingresos del mes' }),
    ).toBeNull();
  });

  it('hides revenue from the secretary assistant dashboard', async () => {
    openDashboard('SECRETARY_ASSISTANT');

    expect(
      await screen.findByRole('region', { name: 'Pacientes pendientes' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Ingresos del mes' }),
    ).toBeNull();
  });

  it('keeps read access while write authorization is withdrawn', async () => {
    renderDemo();

    await screen.findByText(consultationEntry.text);
    fireEvent.click(screen.getByLabelText('Autorización clínica de escritura'));

    expect(screen.getByText(consultationEntry.text)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nueva entrada' })).toBeNull();
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
    expect(screen.queryByRole('button', { name: 'Nueva entrada' })).toBeNull();
  });

  describe('mockup fidelity for the demo patient', () => {
    it('shows the planned procedures with read-only COP costs and the clinical reason', async () => {
      renderDemo();

      const plan = await screen.findByRole('region', {
        name: 'Plan de Tratamiento y Procedimientos',
      });
      await screen.findByRole('cell', { name: /^Limpieza profunda/ });
      expect(
        within(plan)
          .getAllByRole('columnheader')
          .map((header) => header.textContent),
      ).toEqual(['Completado', 'Procedimiento', 'Costo (COP)', 'Motivo']);
      expect(
        screen.getByRole('cell', { name: /^Resina simple/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('cell', { name: /^Extracción simple/ }),
      ).toBeInTheDocument();
      expect(plan).toHaveTextContent(/Total estimado.*550\.000,00/);
      expect(within(plan).queryByRole('textbox')).toBeNull();
    });

    it('lists the active diagnoses recorded in the consultation', async () => {
      renderDemo();

      const card = await screen.findByRole('region', {
        name: 'Diagnósticos Activos',
      });
      expect(
        await within(card).findByText(/Caries oclusal profunda - Pieza 18/),
      ).toBeInTheDocument();
      expect(card).toHaveTextContent('Gingivitis leve localizada');
    });
  });
});
