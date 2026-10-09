import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  consultationEntry,
  evolutionEntry,
} from '../../../../fixtures/clinicalFixtures';
import { ClinicalPortalPage } from './ClinicalPortalPage';
import type { ClinicalRecordEntriesPort } from '../../../../application/clinicalRecordEntriesWorkflow';
import type { ClinicalRole } from '../../../../model/clinicalAccess';
import { RecordClinicalEntry } from '../../../../application/recordClinicalEntry';
import { ReadPatientForCare } from '../../../../application/readPatientForCare';

interface BoundPageProps {
  readonly patientId: string | null;
  readonly role: ClinicalRole | null;
  readonly clinicalReadAuthorized: boolean;
  readonly readPort: ClinicalRecordEntriesPort;
  readonly clinicalWriteAuthorized?: boolean;
  readonly writer?: RecordClinicalEntry;
}

describe('ClinicalPortalPage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps the federation placeholder without synthetic records by default', () => {
    render(<ClinicalPortalPage />);

    expect(
      screen.getByRole('heading', { name: 'Clinical portal' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    expect(screen.queryByText(evolutionEntry.text)).toBeNull();
    expect(screen.queryByText(/Modo demostraci/)).toBeNull();
  });

  it('does not derive write access from read authorization', async () => {
    const port: ClinicalRecordEntriesPort = {
      findRecordId: async () => 'record-1',
      readEntries: async () => ({
        data: [consultationEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    const BoundPage =
      ClinicalPortalPage as unknown as React.ComponentType<BoundPageProps>;
    render(
      <BoundPage
        patientId="patient-1"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={port}
      />,
    );

    expect(await screen.findByText(consultationEntry.text)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nueva entrada' })).toBeNull();
    expect(screen.queryByLabelText('Narrativa clínica')).toBeNull();
  });

  it('submits through the injected use case with the write context', async () => {
    const entries = [consultationEntry];
    const port = {
      findRecordId: vi.fn().mockResolvedValue('record-1'),
      readEntries: async () => ({
        data: [...entries],
        meta: { page: 1, limit: 20, total: entries.length, totalPages: 1 },
      }),
      appendEntry: vi.fn(
        async (_recordId: string, request: { text: string }) => {
          entries.push({ ...evolutionEntry, id: 'new', text: request.text });
        },
      ),
    };
    const BoundPage = ClinicalPortalPage as unknown as React.ComponentType<
      BoundPageProps & { readonly patientReader?: ReadPatientForCare }
    >;
    render(
      <BoundPage
        patientId="patient-1"
        role="DENTIST"
        clinicalReadAuthorized
        clinicalWriteAuthorized
        readPort={port}
        writer={new RecordClinicalEntry(port)}
        patientReader={
          new ReadPatientForCare({
            readPatient: async (id) => ({
              id,
              name: 'Ana Demo',
              status: 'ACTIVE',
              version: 1,
            }),
          })
        }
      />,
    );
    await screen.findByText(consultationEntry.text);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Nueva entrada' }),
    );
    fireEvent.change(screen.getByLabelText('Narrativa clínica'), {
      target: { value: 'Nota inyectada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    expect(
      await screen.findByText('Nota inyectada', {
        selector: '.cr-entry__text',
      }),
    ).toBeInTheDocument();
    expect(port.appendEntry).toHaveBeenCalledWith(
      'record-1',
      { kind: 'CONSULTATION', text: 'Nota inyectada' },
      expect.any(String),
    );
  });

  it('loads authorized entries from an explicit patient context and typed port', async () => {
    const readPort: ClinicalRecordEntriesPort = {
      findRecordId: vi.fn().mockResolvedValue('record-1'),
      readEntries: vi.fn().mockResolvedValue({
        data: [consultationEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    const BoundPage =
      ClinicalPortalPage as unknown as React.ComponentType<BoundPageProps>;

    render(
      <BoundPage
        patientId="patient-1"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={readPort}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(consultationEntry.text)).toBeInTheDocument(),
    );
    expect(readPort.findRecordId).toHaveBeenCalledWith('patient-1');
    expect(readPort.readEntries).toHaveBeenCalledWith('record-1');
  });

  it('hides old entries immediately when the injected port changes', async () => {
    const firstPort: ClinicalRecordEntriesPort = {
      findRecordId: async () => 'record-1',
      readEntries: async () => ({
        data: [consultationEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    let resolveSecond!: (value: string) => void;
    const secondPort: ClinicalRecordEntriesPort = {
      findRecordId: () => new Promise((resolve) => (resolveSecond = resolve)),
      readEntries: async () => ({
        data: [evolutionEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    const BoundPage =
      ClinicalPortalPage as unknown as React.ComponentType<BoundPageProps>;
    const { rerender } = render(
      <BoundPage
        patientId="patient-1"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={firstPort}
      />,
    );
    expect(await screen.findByText(consultationEntry.text)).toBeInTheDocument();

    rerender(
      <BoundPage
        patientId="patient-1"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={secondPort}
      />,
    );

    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    resolveSecond('record-2');
    expect(await screen.findByText(evolutionEntry.text)).toBeInTheDocument();
  });

  it('does not restore narrative before a fresh load when authorization returns', async () => {
    const readPort: ClinicalRecordEntriesPort = {
      findRecordId: vi.fn().mockResolvedValue('record-1'),
      readEntries: vi.fn().mockResolvedValue({
        data: [consultationEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    const BoundPage =
      ClinicalPortalPage as unknown as React.ComponentType<BoundPageProps>;
    const { rerender } = render(
      <BoundPage
        patientId="patient-1"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={readPort}
      />,
    );
    expect(await screen.findByText(consultationEntry.text)).toBeInTheDocument();
    rerender(
      <BoundPage
        patientId="patient-1"
        role="DENTIST"
        clinicalReadAuthorized={false}
        readPort={readPort}
      />,
    );
    rerender(
      <BoundPage
        patientId="patient-1"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={readPort}
      />,
    );

    expect(screen.queryByText(consultationEntry.text)).toBeNull();
  });

  it('hides cached narrative when the authorized role changes', async () => {
    let resolveAdmin!: (value: string) => void;
    const readPort: ClinicalRecordEntriesPort = {
      findRecordId: vi
        .fn()
        .mockResolvedValueOnce('record-dentist')
        .mockImplementationOnce(
          () => new Promise((resolve) => (resolveAdmin = resolve)),
        ),
      readEntries: async () => ({
        data: [consultationEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    const BoundPage =
      ClinicalPortalPage as unknown as React.ComponentType<BoundPageProps>;
    const { rerender } = render(
      <BoundPage
        patientId="patient-1"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={readPort}
      />,
    );
    expect(await screen.findByText(consultationEntry.text)).toBeInTheDocument();
    rerender(
      <BoundPage
        patientId="patient-1"
        role="ADMINISTRATOR"
        clinicalReadAuthorized
        readPort={readPort}
      />,
    );

    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    resolveAdmin('record-admin');
  });

  it('does not read for denied or missing patient contexts', () => {
    const readPort: ClinicalRecordEntriesPort = {
      findRecordId: vi.fn(),
      readEntries: vi.fn(),
    };
    const BoundPage =
      ClinicalPortalPage as unknown as React.ComponentType<BoundPageProps>;
    const { rerender } = render(
      <BoundPage
        patientId="patient-1"
        role="SECRETARY_ASSISTANT"
        clinicalReadAuthorized
        readPort={readPort}
      />,
    );
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
    rerender(
      <BoundPage
        patientId={null}
        role="DENTIST"
        clinicalReadAuthorized
        readPort={readPort}
      />,
    );
    expect(readPort.findRecordId).not.toHaveBeenCalled();
  });

  it('hides patient A before patient B resolves', async () => {
    let resolveB!: (value: string) => void;
    const port: ClinicalRecordEntriesPort = {
      findRecordId: (patientId) =>
        patientId === 'a'
          ? Promise.resolve('record-a')
          : new Promise((resolve) => (resolveB = resolve)),
      readEntries: async (recordId) => ({
        data: [recordId === 'record-a' ? consultationEntry : evolutionEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    const BoundPage =
      ClinicalPortalPage as unknown as React.ComponentType<BoundPageProps>;
    const { rerender } = render(
      <BoundPage
        patientId="a"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={port}
      />,
    );
    expect(await screen.findByText(consultationEntry.text)).toBeInTheDocument();
    rerender(
      <BoundPage
        patientId="b"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={port}
      />,
    );
    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    resolveB('record-b');
    expect(await screen.findByText(evolutionEntry.text)).toBeInTheDocument();
  });

  it('hides clinical content immediately when authorization is revoked', async () => {
    const port: ClinicalRecordEntriesPort = {
      findRecordId: async () => 'record',
      readEntries: async () => ({
        data: [consultationEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    const BoundPage =
      ClinicalPortalPage as unknown as React.ComponentType<BoundPageProps>;
    const { rerender } = render(
      <BoundPage
        patientId="a"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={port}
      />,
    );
    expect(await screen.findByText(consultationEntry.text)).toBeInTheDocument();
    rerender(
      <BoundPage
        patientId="a"
        role="DENTIST"
        clinicalReadAuthorized={false}
        readPort={port}
      />,
    );
    expect(screen.queryByText(consultationEntry.text)).toBeNull();
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
  });

  it('does not render a pending read after unmount', async () => {
    let resolve!: (value: string) => void;
    const port: ClinicalRecordEntriesPort = {
      findRecordId: () => new Promise((done) => (resolve = done)),
      readEntries: async () => ({
        data: [consultationEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    const BoundPage =
      ClinicalPortalPage as unknown as React.ComponentType<BoundPageProps>;
    const { container, unmount } = render(
      <BoundPage
        patientId="a"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={port}
      />,
    );
    unmount();
    resolve('record');
    await Promise.resolve();
    expect(container.textContent).toBe('');
  });

  describe('patient header', () => {
    const readPort: ClinicalRecordEntriesPort = {
      findRecordId: async () => 'record-1',
      readEntries: async () => ({
        data: [consultationEntry],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    };
    const patients = (name: string) =>
      new ReadPatientForCare({
        readPatient: async (id) => ({
          id,
          name,
          phone: '+57 300 000 0000',
          status: 'ACTIVE',
          version: 1,
        }),
      });
    const HeaderPage = ClinicalPortalPage as unknown as React.ComponentType<
      BoundPageProps & { readonly patientReader?: ReadPatientForCare }
    >;

    it('shows the minimized care projection for an authorized reader', async () => {
      render(
        <HeaderPage
          patientId="patient-1"
          role="DENTIST"
          clinicalReadAuthorized
          readPort={readPort}
          patientReader={patients('Ana Demo')}
        />,
      );

      expect(
        await screen.findByRole('heading', { name: 'Ana Demo' }),
      ).toBeInTheDocument();
      expect(screen.getByText('+57 300 000 0000')).toBeInTheDocument();
      expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    it('does not show patient identity to a secretary assistant', async () => {
      render(
        <HeaderPage
          patientId="patient-1"
          role="SECRETARY_ASSISTANT"
          clinicalReadAuthorized
          readPort={readPort}
          patientReader={patients('Ana Demo')}
        />,
      );

      expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
      await Promise.resolve();
      expect(screen.queryByText('Ana Demo')).toBeNull();
    });

    it('hides the previous patient while the next one loads', async () => {
      let resolveB!: (name: string) => void;
      const reader = new ReadPatientForCare({
        readPatient: (id) =>
          id === 'a'
            ? Promise.resolve({
                id,
                name: 'Paciente A',
                status: 'ACTIVE',
                version: 1,
              })
            : new Promise(
                (done) =>
                  (resolveB = (name) =>
                    done({ id, name, status: 'ACTIVE', version: 1 })),
              ),
      });
      const { rerender } = render(
        <HeaderPage
          patientId="a"
          role="DENTIST"
          clinicalReadAuthorized
          readPort={readPort}
          patientReader={reader}
        />,
      );
      expect(await screen.findByText('Paciente A')).toBeInTheDocument();
      rerender(
        <HeaderPage
          patientId="b"
          role="DENTIST"
          clinicalReadAuthorized
          readPort={readPort}
          patientReader={reader}
        />,
      );

      expect(screen.queryByText('Paciente A')).toBeNull();
      resolveB('Paciente B');
      expect(await screen.findByText('Paciente B')).toBeInTheDocument();
    });

    it('offers a new-entry action only to writers and focuses the narrative', async () => {
      const writer = new RecordClinicalEntry({
        findRecordId: async () => 'record-1',
        appendEntry: async () => undefined,
      });
      const { rerender } = render(
        <HeaderPage
          patientId="patient-1"
          role="DENTIST"
          clinicalReadAuthorized
          readPort={readPort}
          patientReader={patients('Ana Demo')}
        />,
      );
      await screen.findByRole('heading', { name: 'Ana Demo' });
      expect(
        screen.queryByRole('button', { name: 'Nueva entrada' }),
      ).toBeNull();

      rerender(
        <HeaderPage
          patientId="patient-1"
          role="DENTIST"
          clinicalReadAuthorized
          clinicalWriteAuthorized
          readPort={readPort}
          writer={writer}
          patientReader={patients('Ana Demo')}
        />,
      );
      fireEvent.click(
        await screen.findByRole('button', { name: 'Nueva entrada' }),
      );

      expect(screen.getByLabelText('Narrativa clínica')).toHaveFocus();
    });
  });

  it('retries the current patient and shows recovered content', async () => {
    const port: ClinicalRecordEntriesPort = {
      findRecordId: vi.fn().mockResolvedValue('record-retry'),
      readEntries: vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce({
          data: [evolutionEntry],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
    };
    const BoundPage =
      ClinicalPortalPage as unknown as React.ComponentType<BoundPageProps>;
    render(
      <BoundPage
        patientId="retry"
        role="DENTIST"
        clinicalReadAuthorized
        readPort={port}
      />,
    );
    expect(
      await screen.findByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText(evolutionEntry.text)).toBeInTheDocument();
    expect(port.findRecordId).toHaveBeenCalledTimes(2);
    expect(port.findRecordId).toHaveBeenLastCalledWith('retry');
  });
});
