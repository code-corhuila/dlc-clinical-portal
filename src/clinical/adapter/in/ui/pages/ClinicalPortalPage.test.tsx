import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  consultationEntry,
  evolutionEntry,
} from '../../../../fixtures/clinicalFixtures';
import { ClinicalPortalPage } from './ClinicalPortalPage';
import type { ClinicalRecordEntriesPort } from '../../../../application/clinicalRecordEntriesWorkflow';
import type { ClinicalRole } from '../../../../model/clinicalAccess';

interface BoundPageProps {
  readonly patientId: string | null;
  readonly role: ClinicalRole | null;
  readonly clinicalReadAuthorized: boolean;
  readonly readPort: ClinicalRecordEntriesPort;
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

  it('shows the synthetic clinical record demo only with the dev flag', () => {
    vi.stubEnv('VITE_CLINICAL_DEMO', 'true');
    render(<ClinicalPortalPage />);

    expect(screen.getByText(consultationEntry.text)).toBeInTheDocument();
    expect(screen.getByText(evolutionEntry.text)).toBeInTheDocument();
    expect(screen.getByText(/Modo demostraci/)).toBeInTheDocument();
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
