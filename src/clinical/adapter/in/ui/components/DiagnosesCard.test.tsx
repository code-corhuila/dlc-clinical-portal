import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ClinicalEntry } from '../../../../model/clinicalEntry';
import { DiagnosesCard } from './DiagnosesCard';

const entry = (fields: Partial<ClinicalEntry>): ClinicalEntry =>
  ({
    recordId: 'r-1',
    authorId: 'a-1',
    updatedAt: '2026-10-24T03:50:00Z',
    version: 1,
    ...fields,
  }) as ClinicalEntry;

describe('DiagnosesCard', () => {
  it('dates a late-evening diagnosis on the clinic day, not the UTC day', () => {
    render(
      <DiagnosesCard
        entries={[
          entry({
            id: 'c-1',
            kind: 'CONSULTATION',
            text: 'Dolor',
            createdAt: '2026-10-24T03:50:00Z',
          }),
          entry({
            id: 'd-1',
            kind: 'DIAGNOSIS',
            text: 'Caries',
            consultationId: 'c-1',
            createdAt: '2026-10-24T03:50:00Z',
          }),
        ]}
      />,
    );

    expect(screen.getByText(/Detectado:/)).toHaveTextContent(
      'Detectado: 23 oct 2026 · Consulta del 2026-10-23',
    );
  });
});
