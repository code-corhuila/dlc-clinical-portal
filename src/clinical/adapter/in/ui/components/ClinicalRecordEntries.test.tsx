import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  consultationEntry,
  evolutionEntry,
} from '../../../../fixtures/clinicalFixtures';
import type { ClinicalEntry } from '../../../../model/clinicalEntry';
import type { ClinicalRecordStatus } from '../../../../model/clinicalRecordView';
import type { ClinicalRecordEntriesProps } from './ClinicalRecordEntries';
import { ClinicalRecordEntries } from './ClinicalRecordEntries';

function readyStatus(entries: readonly ClinicalEntry[]): ClinicalRecordStatus {
  return {
    kind: 'ready',
    page: {
      data: entries,
      meta: {
        page: 1,
        limit: 20,
        total: entries.length,
        totalPages: entries.length === 0 ? 0 : 1,
      },
    },
  };
}

function renderEntries(
  props: Partial<ClinicalRecordEntriesProps> = {},
): ReturnType<typeof render> {
  return render(
    <ClinicalRecordEntries
      role="DENTIST"
      clinicalReadAuthorized
      status={{ kind: 'loading' }}
      {...props}
    />,
  );
}

describe('ClinicalRecordEntries', () => {
  describe('presentation states', () => {
    it('shows the loading state without a retry action', () => {
      renderEntries({ status: { kind: 'loading' } });

      expect(screen.getByRole('status')).toHaveTextContent(
        'Cargando registro clínico',
      );
      expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
    });

    it('shows the empty state when the record has no entries', () => {
      renderEntries({ status: readyStatus([]) });

      expect(
        screen.getByRole('heading', { name: 'Sin entradas clínicas' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('shows a retryable error and retries on demand', () => {
      const onRetry = vi.fn();
      renderEntries({
        status: { kind: 'error', message: 'Fallo transitorio del servicio.' },
        onRetry,
      });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Fallo transitorio del servicio.',
      );
      fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('keeps an error accessible without an inert retry button', () => {
      renderEntries({
        status: { kind: 'error', message: 'Fallo transitorio del servicio.' },
      });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Fallo transitorio del servicio.',
      );
      expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
    });

    it('shows the forbidden state when the server denies the request', () => {
      renderEntries({ status: { kind: 'forbidden' } });

      expect(
        screen.getByRole('heading', { name: 'Acceso denegado' }),
      ).toBeInTheDocument();
      expect(screen.queryByText(consultationEntry.text)).toBeNull();
    });
  });

  describe('data state', () => {
    it('shows the consultation a diagnosis is linked to', () => {
      renderEntries({
        status: readyStatus([
          consultationEntry,
          {
            ...evolutionEntry,
            id: 'diagnosis-1',
            kind: 'DIAGNOSIS',
            text: 'Caries oclusal',
            consultationId: consultationEntry.id,
          },
        ]),
      });

      expect(
        screen.getByText('Diagnóstico', { selector: '.cr-entry__kind' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Vinculado a la consulta del/)).toHaveTextContent(
        '2026',
      );
    });

    it('renders a CONSULTATION entry with text, author and formatted createdAt', () => {
      renderEntries({ status: readyStatus([consultationEntry]) });

      expect(
        screen.getByText('Consulta', { selector: '.cr-entry__kind' }),
      ).toBeInTheDocument();
      expect(screen.getByText(consultationEntry.text)).toBeInTheDocument();
      expect(screen.getByText('Autor')).toBeInTheDocument();
      expect(screen.getByText(consultationEntry.authorId)).toBeInTheDocument();
      expect(screen.getByText('Fecha y hora')).toBeInTheDocument();

      const timeElement = screen.getByText((_, element) => {
        return (
          element?.tagName.toLowerCase() === 'time' &&
          element?.getAttribute('datetime') === consultationEntry.createdAt
        );
      });
      expect(timeElement).toBeInTheDocument();
      expect(timeElement.getAttribute('datetime')).toBe(
        consultationEntry.createdAt,
      );
      expect(timeElement.textContent).toBe('02 mar 2026, 14:30 UTC');
    });

    it('renders an EVOLUTION entry with its text and author', () => {
      renderEntries({ status: readyStatus([evolutionEntry]) });

      expect(
        screen.getByText('Evolución', { selector: '.cr-entry__kind' }),
      ).toBeInTheDocument();
      expect(screen.getByText(evolutionEntry.text)).toBeInTheDocument();
      expect(screen.getByText(evolutionEntry.authorId)).toBeInTheDocument();
    });

    it('shows an injected author display name', () => {
      renderEntries({
        status: readyStatus([evolutionEntry]),
        authorName: () => 'Profesional asignado',
      });

      expect(screen.getByText('Profesional asignado')).toBeInTheDocument();
      expect(screen.queryByText(evolutionEntry.authorId)).toBeNull();
    });

    it('omits the date field when createdAt is not present', () => {
      const { container } = renderEntries({
        status: readyStatus([evolutionEntry]),
      });

      expect(screen.queryByText('Fecha y hora')).toBeNull();
      expect(container.querySelector('time')).toBeNull();
      expect(screen.getByText('Texto')).toBeInTheDocument();
    });

    it('keeps the verbatim kind outside the presented ones', () => {
      renderEntries({
        status: readyStatus([{ ...consultationEntry, kind: 'ALLERGY' }]),
      });

      expect(screen.getByText('ALLERGY')).toBeInTheDocument();
      expect(
        screen.queryByText('Consulta', { selector: '.cr-entry__kind' }),
      ).toBeNull();
    });
  });

  describe('clinical display authorization', () => {
    it('never shows clinical narrative to SECRETARY_ASSISTANT', () => {
      renderEntries({
        role: 'SECRETARY_ASSISTANT',
        clinicalReadAuthorized: true,
        status: readyStatus([consultationEntry]),
      });

      expect(
        screen.getByRole('heading', { name: 'Acceso denegado' }),
      ).toBeInTheDocument();
      expect(screen.queryByText(consultationEntry.text)).toBeNull();
      expect(screen.queryByText('Consulta')).toBeNull();
    });

    it('denies an ADMINISTRATOR without explicit clinical authorization', () => {
      renderEntries({
        role: 'ADMINISTRATOR',
        clinicalReadAuthorized: false,
        status: readyStatus([consultationEntry]),
      });

      expect(
        screen.getByRole('heading', { name: 'Acceso denegado' }),
      ).toBeInTheDocument();
      expect(screen.queryByText(consultationEntry.text)).toBeNull();
    });

    it('denies a DENTIST without explicit clinical authorization', () => {
      renderEntries({
        clinicalReadAuthorized: false,
        status: readyStatus([consultationEntry]),
      });

      expect(
        screen.getByRole('heading', { name: 'Acceso denegado' }),
      ).toBeInTheDocument();
      expect(screen.queryByText(consultationEntry.text)).toBeNull();
    });

    it('denies a DENTIST when clinical authorization is absent', () => {
      render(
        <ClinicalRecordEntries
          role="DENTIST"
          status={readyStatus([consultationEntry])}
        />,
      );

      expect(
        screen.getByRole('heading', { name: 'Acceso denegado' }),
      ).toBeInTheDocument();
      expect(screen.queryByText(consultationEntry.text)).toBeNull();
    });

    it('allows an ADMINISTRATOR with explicit clinical authorization', () => {
      renderEntries({
        role: 'ADMINISTRATOR',
        clinicalReadAuthorized: true,
        status: readyStatus([consultationEntry]),
      });

      expect(screen.getByText(consultationEntry.text)).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Acceso denegado' }),
      ).toBeNull();
    });

    it('denies access while no role is available', () => {
      renderEntries({
        role: null,
        status: readyStatus([consultationEntry]),
      });

      expect(
        screen.getByRole('heading', { name: 'Acceso denegado' }),
      ).toBeInTheDocument();
      expect(screen.queryByText(consultationEntry.text)).toBeNull();
    });
  });
});
