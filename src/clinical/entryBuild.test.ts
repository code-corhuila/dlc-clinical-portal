// @vitest-environment node
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

/** C01: an independent browser ES module under /portals/clinical/{release}/. */
describe('Clinical entry.js build (composition contract v1)', () => {
  it('builds a self-contained entry under its release directory', async () => {
    const outRoot = mkdtempSync(join(tmpdir(), 'clinical-entry-'));
    process.env.CLINICAL_RELEASE = '1.2.3-test';
    process.env.CLINICAL_ENTRY_OUT = outRoot;

    await build({ configFile: 'vite.entry.config.ts', logLevel: 'silent' });

    const release = join(outRoot, 'portals', 'clinical', '1.2.3-test');
    expect(readdirSync(release)).toEqual(
      expect.arrayContaining(['entry.js', 'entry.css']),
    );
    const code = readdirSync(release)
      .filter((file) => file.endsWith('.js'))
      .map((file) => readFileSync(join(release, file), 'utf8'))
      .join('\n');
    // No bare package imports, import maps or shared framework globals.
    expect(code).not.toMatch(/\bfrom\s*["'](?![./])/);
    expect(code).not.toMatch(/\bimport\s*\(\s*["'](?![./])/);

    // Import has no root bootstrap, API request, listener or DOM side effect.
    const entry = await import(pathToFileURL(join(release, 'entry.js')).href);
    expect(entry.portalId).toBe('clinical');
    expect(entry.contractVersion).toBe(1);
    expect(typeof entry.mount).toBe('function');
  }, 60_000);
});
