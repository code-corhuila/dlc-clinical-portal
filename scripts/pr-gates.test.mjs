import { describe, expect, it } from 'vitest';
import {
  evaluateLineLimit,
  isExcludedFile,
  parseNumstat,
  parseRefList,
  scanArchitecture,
  validateBranch,
  validateCommits,
  validatePrBody,
} from './pr-gates.mjs';

const entry = (path, added, deleted = 0) => ({ path, added, deleted });
const codes = (findings) => findings.map((finding) => finding.code);

describe('line limit gate (norm 9.2)', () => {
  it('allows a diff of exactly 400 computable lines', () => {
    const result = evaluateLineLimit([
      entry('src/clinical/View.tsx', 250, 150),
    ]);
    expect(result.total).toBe(400);
    expect(result.ok).toBe(true);
  });

  it('rejects a diff of 401 computable lines', () => {
    const result = evaluateLineLimit([entry('src/clinical/View.tsx', 401)]);
    expect(result.total).toBe(401);
    expect(result.ok).toBe(false);
  });

  it('excludes test files and does not count them', () => {
    const result = evaluateLineLimit([
      entry('src/clinical/View.test.tsx', 900),
      entry('src/clinical/__tests__/View.spec.ts', 700),
      entry('src/clinical/View.tsx', 10),
    ]);
    expect(result.total).toBe(10);
    expect(result.excluded).toHaveLength(2);
    expect(result.excluded[0].reason).toBe('test file');
    expect(result.ok).toBe(true);
  });

  it('excludes generated artefacts but counts ordinary documentation', () => {
    const result = evaluateLineLimit([
      entry('package-lock.json', 5000),
      entry('coverage/index.html', 300),
      entry('docs/quality/validation-evidence.md', 120),
      entry('src/clinical/View.tsx', 40),
    ]);
    expect(result.total).toBe(160);
    expect(result.excluded.map((item) => item.path)).toEqual([
      'package-lock.json',
      'coverage/index.html',
    ]);
  });

  it('classifies exclusion reasons per file', () => {
    expect(isExcludedFile('src/test/setup.ts')).toBe('test file');
    expect(isExcludedFile('src/clinical/ClinicalPortal.tsx')).toBeNull();
  });

  it('parses git diff --numstat output including binary files', () => {
    const entries = parseNumstat('12\t3\tsrc/a.ts\n-\t-\tassets/logo.png\n');
    expect(entries[0]).toEqual({ added: 12, deleted: 3, path: 'src/a.ts' });
    expect(entries[1].added).toBeNull();
    expect(evaluateLineLimit(entries).binary).toBe(1);
  });
});

describe('branch gate (norm 6.3.1)', () => {
  it('accepts chore/* against develop', () => {
    expect(validateBranch('chore/clinical-pr-gates', 'develop')).toEqual([]);
  });

  it('accepts release/* and hotfix/* against main', () => {
    expect(validateBranch('release/1.0.0', 'main')).toEqual([]);
    expect(validateBranch('hotfix/session-crash', 'main')).toEqual([]);
  });

  it('rejects a prefix that targets another parent branch', () => {
    expect(codes(validateBranch('feat/x', 'qa'))).toContain(
      'BRANCH_WRONG_TARGET',
    );
    expect(codes(validateBranch('qa/hu-07', 'develop'))).toContain(
      'BRANCH_WRONG_TARGET',
    );
  });

  it('rejects a permanent branch used as head', () => {
    expect(codes(validateBranch('develop', 'develop'))).toContain(
      'BRANCH_PERMANENT_HEAD',
    );
  });

  it('rejects prefixes that norm 6.3.3 does not admit', () => {
    expect(codes(validateBranch('promotion/clinical-portal', 'qa'))).toContain(
      'BRANCH_UNKNOWN_PREFIX',
    );
  });

  it('reports the qa vs qa/* nomenclature conflict instead of asserting compliance', () => {
    const findings = validateBranch('qa/hu-07', 'qa');
    expect(codes(findings)).toContain('QA_NOMENCLATURE_UNRESOLVED');
    expect(findings.every((item) => item.level === 'conflict')).toBe(true);
  });

  it('detects the ref namespace collision when both qa and qa/* exist', () => {
    const findings = validateBranch('chore/x', 'develop', ['qa', 'qa/hu-07']);
    expect(codes(findings)).toContain('QA_REF_NAMESPACE_COLLISION');
  });

  it('reports nothing about qa when only the permanent branch exists', () => {
    expect(codes(validateBranch('chore/x', 'develop', ['qa']))).toEqual([]);
  });
});

describe('ref list parsing (regression for remote prefixes)', () => {
  const ciShape = [
    'origin',
    'origin/HEAD',
    'origin/develop',
    'origin/main',
    'origin/qa',
    'origin/qa/hu-001',
    'chore/clinical-pr-gates',
  ].join('\n');

  it('strips origin/ so remote refs compare as short names', () => {
    const refs = parseRefList(ciShape);
    expect(refs).toContain('qa');
    expect(refs).toContain('qa/hu-001');
    expect(refs.some((ref) => ref.startsWith('origin/'))).toBe(false);
  });

  it('detects the namespace collision from an origin-only ref list', () => {
    expect(
      codes(validateBranch('qa/hu-001', 'qa', parseRefList(ciShape))),
    ).toContain('QA_REF_NAMESPACE_COLLISION');
  });

  it('keeps a CI ref list without qa/* free of collision findings', () => {
    const refs = parseRefList('origin/develop\norigin/qa\nchore/x');
    expect(codes(validateBranch('chore/x', 'develop', refs))).toEqual([]);
  });
});

describe('commit gate (norm 8.1 / 15.2)', () => {
  it('accepts conventional subjects with a scope', () => {
    expect(
      validateCommits([
        'feat(clinical): add longitudinal history view',
        'chore(quality): extend formatting gate',
      ]),
    ).toEqual([]);
  });

  it('rejects subjects outside the allowed format', () => {
    expect(codes(validateCommits(['Fix bug']))).toEqual(['COMMIT_SUBJECT']);
    expect(codes(validateCommits(['chore: update files']))).toEqual([
      'COMMIT_SUBJECT',
    ]);
    expect(codes(validateCommits(['feat(clinical): Add uppercase.']))).toEqual([
      'COMMIT_SUBJECT',
    ]);
    expect(codes(validateCommits(['WIP']))).toEqual(['COMMIT_SUBJECT']);
  });
});

const filledBody = [
  '## User story',
  '',
  'dlc-docs#42 and HU-CLN-001 apply.',
  '',
  '## What changed and why',
  '',
  'Adds the PR gates required by the quality policy.',
  '',
  '## How it was tested',
  '',
  'npm test and npm run quality.',
  '',
  '## Evidence',
  '',
  'docs/quality/validation-evidence.md — DEV-CLIN-PORTAL-PRGATES-001.',
  '',
  '## Known limitations',
  '',
  'Static analysis does not replace human review.',
].join('\n');

describe('pull request traceability gate (norm 9.1)', () => {
  it('accepts a filled body with all required sections and a reference', () => {
    expect(validatePrBody(filledBody)).toEqual([]);
  });

  it('rejects a body with a missing section', () => {
    const findings = validatePrBody(
      filledBody.replace('## Known limitations', '## Other'),
    );
    expect(codes(findings)).toContain('PR_SECTION_MISSING');
  });

  it('rejects the unfilled template placeholder', () => {
    const findings = validatePrBody(
      filledBody.replace(
        'dlc-docs#42 and HU-CLN-001 apply.',
        'Link the applicable issue in `dlc-docs`, or explain why no story applies.',
      ),
    );
    expect(codes(findings)).toContain('PR_SECTION_EMPTY');
  });

  it('rejects a story section without any task, HU or issue reference', () => {
    const findings = validatePrBody(
      filledBody.replace('dlc-docs#42 and HU-CLN-001 apply.', 'No reference.'),
    );
    expect(codes(findings)).toContain('PR_TRACEABILITY_MISSING');
  });
});

describe('architecture gate (Anexo H)', () => {
  it('flags an HTTP client deterministically', () => {
    const findings = scanArchitecture([
      { path: 'src/clinical/api.ts', content: 'await fetch("/api/v1/notes")' },
    ]);
    expect(findings[0]).toMatchObject({
      level: 'error',
      code: 'ARCH_HTTP_CLIENT',
    });
  });

  it('flags browser storage used for tokens', () => {
    const findings = scanArchitecture([
      { path: 'src/clinical/session.ts', content: 'localStorage.getItem(t)' },
    ]);
    expect(codes(findings)).toContain('ARCH_TOKEN_STORAGE');
  });

  it('accepts the shell/apiClient boundary', () => {
    expect(
      scanArchitecture([
        {
          path: 'src/clinical/api/notesApi.ts',
          content: "import { apiClient } from 'shell/apiClient';",
        },
      ]),
    ).toEqual([]);
  });

  it('keeps cross bounded context imports as warnings only', () => {
    const findings = scanArchitecture([
      {
        path: 'src/clinical/x.ts',
        content: "import { p } from '../patients';",
      },
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].level).toBe('warning');
    expect(findings[0].code).toBe('ARCH_CROSS_BC_IMPORT');
  });

  it('does not scan test files', () => {
    expect(
      scanArchitecture([
        { path: 'src/clinical/x.test.ts', content: 'fetch("/api/v1/x")' },
      ]),
    ).toEqual([]);
  });
});
