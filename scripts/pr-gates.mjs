#!/usr/bin/env node
/**
 * PR quality gates for dlc-clinical-portal. Reuses the controls the repository
 * norm already defines instead of creating a new validation framework:
 * norm 9.2 (400 computable lines), 6.3.1/6.3.3 (branch prefixes), 8.1/15.2
 * (commit subject), 9.1 (traceability) and Anexo H (portal boundaries).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LINE_LIMIT = 400;
export const PERMANENT_BRANCHES = ['develop', 'qa', 'main'];
export const CHILD_PREFIXES = {
  develop: ['feat/', 'fix/', 'chore/'],
  qa: ['qa/'],
  main: ['release/', 'hotfix/'],
};
export const COMMIT_SUBJECT =
  /^(feat|fix|docs|style|refactor|test|chore|perf)\([a-z0-9.-]+\): [a-z]/;
export const SECTIONS = [
  ['User story', /^##\s+User story\s*$/m],
  ['What changed and why', /^##\s+What changed and why\s*$/m],
  ['How it was tested', /^##\s+How it was tested\s*$/m],
  ['Evidence', /^##\s+Evidence\s*$/m],
  ['Known limitations', /^##\s+Known limitations\s*$/m],
];
export const TRACE_PATTERN =
  /(HU-[A-Z0-9]+-\d+|#[0-9]+|https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/(issues|pull)\/\d+)/;

const PLACEHOLDER = /^link the applicable issue/i;
const PARENT_OF = Object.fromEntries(
  Object.entries(CHILD_PREFIXES).flatMap(([branch, prefixes]) =>
    prefixes.map((prefix) => [prefix, branch]),
  ),
);
const EXCLUDED = [
  [/(^|\/)(tests?|__tests__)\//, 'test file'],
  [/\.(test|spec)\.[cm]?[jt]sx?$/, 'test file'],
  [/(^|\/)(dist|coverage|__generated__)\//, 'generated output'],
  [/\.generated\.[A-Za-z0-9]+$/, 'generated file'],
  [/\.(snap|tsbuildinfo)$/, 'generated artefact'],
  [/(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/, 'lockfile'],
];
const ARCH_RULES = [
  ['error', 'ARCH_HTTP_CLIENT', /\bfetch\s*\(|\baxios\b|\bXMLHttpRequest\b/],
  ['error', 'ARCH_TOKEN_STORAGE', /\blocalStorage\b|\bsessionStorage\b/],
  ['error', 'ARCH_TOKEN_STORAGE', /document\.cookie/],
  ['error', 'ARCH_AUTH_HEADER', /Authorization\s*:/],
  [
    'warning',
    'ARCH_CROSS_BC_IMPORT',
    /from\s+['"][^'"]*(patients|appointments|billing|iam|analytics)[^'"]*['"]/i,
  ],
  ['warning', 'ARCH_ABSOLUTE_API_URL', /https?:\/\/[^'"\s]*\/api\//],
];

/** Returns the exclusion reason for a path, or null when the file counts. */
export function isExcludedFile(path) {
  const rule = EXCLUDED.find(([re]) => re.test(path));
  return rule ? rule[1] : null;
}

export function parseNumstat(output) {
  return output
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [added, deleted, ...rest] = line.split('\t');
      return {
        added: added === '-' ? null : Number(added),
        deleted: deleted === '-' ? null : Number(deleted),
        path: rest.join(' '),
      };
    });
}

/** Norm 9.2: insertions + deletions of the real PR diff, minus excluded files. */
export function evaluateLineLimit(entries, limit = LINE_LIMIT) {
  const counted = [];
  const excluded = [];
  let total = 0;
  let binary = 0;
  for (const { path: raw, added, deleted } of entries) {
    const path = raw.includes(' => ') ? raw.split(' => ').pop() : raw;
    const lines = added === null || deleted === null ? 0 : added + deleted;
    if (added === null) binary += 1;
    const reason = isExcludedFile(path);
    if (reason) excluded.push({ path, lines, reason });
    else {
      counted.push({ path, lines });
      total += lines;
    }
  }
  return { limit, total, ok: total <= limit, counted, excluded, binary };
}

/** Norm 6.3.1/6.3.3 plus the unresolved qa vs qa/* ref namespace conflict. */
export function validateBranch(head, base, refs = []) {
  const findings = [];
  const add = (level, code, message) => findings.push({ level, code, message });
  const slash = head.indexOf('/');
  const prefix = slash > 0 ? head.slice(0, slash + 1) : null;
  if (PERMANENT_BRANCHES.includes(head))
    add('error', 'BRANCH_PERMANENT_HEAD', `${head} is permanent (6.2.2)`);
  if (!prefix)
    add('error', 'BRANCH_NO_PREFIX', `${head} has no prefix (6.3.1)`);
  else if (!PARENT_OF[prefix])
    add('error', 'BRANCH_UNKNOWN_PREFIX', `${prefix} not admitted (6.3.3)`);
  else if (base !== PARENT_OF[prefix])
    add('error', 'BRANCH_WRONG_TARGET', `${prefix} → ${PARENT_OF[prefix]}`);
  const kids = refs.filter((ref) => ref.startsWith('qa/'));
  if (refs.includes('qa') && kids.length)
    add('conflict', 'QA_REF_NAMESPACE_COLLISION', 'qa/* collides with qa');
  if (prefix === 'qa/')
    add('conflict', 'QA_NOMENCLATURE_UNRESOLVED', 'qa/* naming unresolved');
  return findings;
}

export function validateCommits(subjects) {
  return subjects
    .filter((subject) => !COMMIT_SUBJECT.test(subject))
    .map((subject) => ({ level: 'error', code: 'COMMIT_SUBJECT', subject }));
}

function sectionContent(body, pattern) {
  const match = pattern.exec(body);
  if (!match) return null;
  const rest = body.slice(match.index + match[0].length);
  const next = rest.search(/^##\s/m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

/** Norm 9.1 plus the portal sections: changes, validation, evidence, limits. */
export function validatePrBody(body = '') {
  const findings = [];
  const add = (code, message) =>
    findings.push({ level: 'error', code, message });
  const story = sectionContent(body, SECTIONS[0][1]) ?? '';
  for (const [label, pattern] of SECTIONS) {
    const content = sectionContent(body, pattern);
    if (content === null) add('PR_SECTION_MISSING', `missing ${label}`);
    else if (content === '' || PLACEHOLDER.test(content))
      add('PR_SECTION_EMPTY', `${label} unfilled`);
  }
  if (story !== '' && !TRACE_PATTERN.test(story))
    add('PR_TRACEABILITY_MISSING', 'no task, HU or Issue in User story');
  return findings;
}

export function scanArchitecture(files) {
  const findings = [];
  for (const file of files) {
    if (isExcludedFile(file.path)) continue;
    for (const [level, code, re] of ARCH_RULES) {
      if (re.test(file.content)) {
        const message =
          level === 'warning' ? 'heuristic: human review' : 'Anexo H';
        findings.push({ level, code, path: file.path, message });
      }
    }
  }
  return findings;
}

const git = (args) => execFileSync('git', args, { encoding: 'utf8' });

/** Local and remote refs are compared as short names, without `origin/`. */
export const parseRefList = (text) =>
  text
    .split('\n')
    .map((line) => line.trim().replace(/^(remotes\/)?origin\//, ''))
    .filter(
      (line) => line !== '' && line !== 'origin' && !line.startsWith('HEAD'),
    );

const refs = () =>
  parseRefList(git(['branch', '-a', '--format=%(refname:short)']));

function sources(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sources(path, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(path);
  }
  return out;
}

function readBody(opts) {
  if (opts.body) return readFileSync(opts.body, 'utf8');
  if (process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(
      readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'),
    );
    return event.pull_request?.body ?? '';
  }
  return null;
}

function report(name, findings) {
  for (const f of findings) {
    const where = `${name}${f.path ? ' ' + f.path : ''}`;
    console.log(`[${f.level}] ${where}: ${f.code} — ${f.message ?? f.subject}`);
  }
  const failed = findings.some((f) => f.level !== 'warning');
  console.log(
    `${name}: ${failed ? 'FAIL' : 'PASS'} (${findings.length} finding(s))`,
  );
  return failed ? 1 : 0;
}

const options = (args) => ({
  base: arg(args, '--base') ?? 'origin/develop',
  head: arg(args, '--head') ?? 'HEAD',
  body: arg(args, '--body'),
  limit: Number(arg(args, '--limit') ?? LINE_LIMIT),
});

function arg(args, flag) {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
}

const commands = {
  lines: (o) => {
    const range = o.head === 'WORKTREE' ? o.base : `${o.base}...${o.head}`;
    const result = evaluateLineLimit(
      parseNumstat(git(['diff', '--numstat', range])),
      o.limit,
    );
    console.log(
      `lines: ${result.total}/${result.limit} computable, ${result.excluded.length} excluded, ${result.binary} binary`,
    );
    for (const e of result.excluded)
      console.log(`[info] excluded ${e.path} (${e.reason}): ${e.lines}`);
    console.log(`lines: ${result.ok ? 'PASS' : 'FAIL'}`);
    return result.ok ? 0 : 1;
  },
  branch: (o) => report('branch', validateBranch(o.head, o.base, refs())),
  commits: (o) =>
    report(
      'commits',
      validateCommits(
        git(['log', '--format=%s', `${o.base}..${o.head}`])
          .split('\n')
          .filter((line) => line.trim() !== ''),
      ),
    ),
  pr: (o) => {
    const body = readBody(o);
    if (body === null) {
      console.log('pr: PENDING — no pull request body (use --body <file>)');
      return 1;
    }
    return report('pr', validatePrBody(body));
  },
  arch: () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');
    const files = sources(root).map((path) => ({
      path: path.replace(/\\/g, '/').split('/src/').pop(),
      content: readFileSync(path, 'utf8'),
    }));
    return report('arch', scanArchitecture(files));
  },
};

function main(argv) {
  const [command, ...rest] = argv;
  if (!command || command === 'help') {
    console.log(
      'usage: node scripts/pr-gates.mjs <lines|branch|commits|pr|arch> [--base ref] [--head ref] [--body file]',
    );
    return 0;
  }
  if (!commands[command]) {
    console.log(`unknown command: ${command}`);
    return 1;
  }
  return commands[command](options(rest));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  process.exitCode = main(process.argv.slice(2));
