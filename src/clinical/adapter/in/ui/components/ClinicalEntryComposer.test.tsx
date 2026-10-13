import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClinicalEntryComposer } from './ClinicalEntryComposer';

const validProps = {
  role: 'DENTIST' as const,
  clinicalWriteAuthorized: true,
};

function renderComposer(
  props: Partial<React.ComponentProps<typeof ClinicalEntryComposer>> = {},
) {
  return render(<ClinicalEntryComposer {...validProps} {...props} />);
}

function submit(text: string) {
  fireEvent.change(screen.getByLabelText('Narrativa clínica'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
}

describe('ClinicalEntryComposer', () => {
  const consultations = [
    { id: 'c-1', label: '02 mar 2026 · Revisión inicial' },
  ];

  it('reuses the idempotency key on retry and renews it after success', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(undefined);
    renderComposer({ onSubmit });

    submit('Consulta con reintento');
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    submit('Otra consulta');
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(3));

    const keys = onSubmit.mock.calls.map((call) => call[1]);
    expect(keys[0]).toEqual(expect.any(String));
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it('clears the narrative after a successful submission', async () => {
    renderComposer({ onSubmit: vi.fn().mockResolvedValue(undefined) });
    submit('Consulta guardada');

    await waitFor(() =>
      expect(screen.getByLabelText('Narrativa clínica')).toHaveValue(''),
    );
  });

  it('keeps the narrative when the submission fails', async () => {
    renderComposer({ onSubmit: vi.fn().mockRejectedValue(new Error('x')) });
    submit('Consulta fallida');

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Narrativa clínica')).toHaveValue(
      'Consulta fallida',
    );
  });

  it('requires an explicit consultation for a diagnosis', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderComposer({ onSubmit, consultations });
    fireEvent.change(screen.getByLabelText('Tipo de entrada'), {
      target: { value: 'DIAGNOSIS' },
    });

    expect(screen.getByLabelText('Consulta asociada')).toHaveValue('');
    submit('Caries oclusal');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Seleccione la consulta asociada al diagnóstico.',
    );
  });

  it('submits a diagnosis with the selected consultation', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderComposer({ onSubmit, consultations });
    fireEvent.change(screen.getByLabelText('Tipo de entrada'), {
      target: { value: 'DIAGNOSIS' },
    });
    fireEvent.change(screen.getByLabelText('Consulta asociada'), {
      target: { value: 'c-1' },
    });
    submit('Caries oclusal');

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'DIAGNOSIS',
        text: 'Caries oclusal',
        consultationId: 'c-1',
      }),
      expect.any(String),
    );
  });

  it('submits an exact CONSULTATION request', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderComposer({ onSubmit });

    submit('Narrativa válida');

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'CONSULTATION',
        text: 'Narrativa válida',
      }),
      expect.any(String),
    );
  });

  it('submits an exact EVOLUTION request', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderComposer({ onSubmit });

    fireEvent.change(screen.getByLabelText('Tipo de entrada'), {
      target: { value: 'EVOLUTION' },
    });
    submit('Seguimiento válido');

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'EVOLUTION',
        text: 'Seguimiento válido',
      }),
      expect.any(String),
    );
  });

  it.each(['', '   '])('rejects blank narrative %j', (text) => {
    renderComposer({ onSubmit: vi.fn().mockResolvedValue(undefined) });

    submit(text);

    expect(screen.getByRole('alert')).toHaveTextContent('obligatoria');
  });

  it('rejects a narrative over 10000 characters', () => {
    renderComposer({ onSubmit: vi.fn().mockResolvedValue(undefined) });

    submit('x'.repeat(10001));

    expect(screen.getByRole('alert')).toHaveTextContent('10000');
  });

  it('preserves valid narrative content', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderComposer({ onSubmit });

    submit('  Contenido clínico válido.  ');

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'CONSULTATION',
        text: '  Contenido clínico válido.  ',
      }),
      expect.any(String),
    );
  });

  it.each([
    ['SECRETARY_ASSISTANT', true],
    ['DENTIST', false],
    ['ADMINISTRATOR', false],
    ['DENTIST', undefined],
  ] as const)(
    'denies write access for %s with permission %s',
    (role, permission) => {
      renderComposer({
        role,
        clinicalWriteAuthorized: permission,
        onSubmit: vi.fn().mockResolvedValue(undefined),
      });

      expect(screen.getByText('Acceso no autorizado')).toBeInTheDocument();
      expect(screen.queryByLabelText('Narrativa clínica')).toBeNull();
    },
  );

  it('disables submission when integration is unavailable', () => {
    renderComposer();

    expect(
      screen.getByRole('button', { name: 'Registrar entrada' }),
    ).toBeDisabled();
    expect(screen.getByText(/integración pendiente/i)).toBeInTheDocument();
  });

  it('denies writes when the supplied record is not writable', () => {
    renderComposer({
      recordWritable: false,
      onSubmit: vi.fn().mockResolvedValue(undefined),
    });

    expect(screen.getByText('Acceso no autorizado')).toBeInTheDocument();
    expect(screen.queryByLabelText('Narrativa clínica')).toBeNull();
  });

  it('prevents duplicate submission while pending', () => {
    let resolve: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    renderComposer({ onSubmit });

    submit('Narrativa válida');
    fireEvent.click(screen.getByRole('button', { name: 'Enviando entrada' }));
    resolve?.();

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows submission failure without claiming success', async () => {
    renderComposer({ onSubmit: vi.fn().mockRejectedValue(new Error('falló')) });

    submit('Narrativa válida');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No fue posible',
    );
    expect(screen.queryByText(/guardado correctamente/i)).toBeNull();
  });
});
