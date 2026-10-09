import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as {
  version: string;
};

/**
 * Composition contract v1 (C01): one independent ES module per release at
 * /portals/clinical/{release}/entry.js. React is bundled (no bare imports or
 * shared globals); CSS is a sibling file that mount() attaches inside its host.
 */
export default defineConfig(({ mode }) => {
  const release =
    process.env.CLINICAL_RELEASE ??
    (mode === 'demo' ? `${version}-demo` : version);
  if (!/^(?!\.+$)[A-Za-z0-9._-]+$/.test(release))
    throw new Error(`Invalid Clinical release: ${release}`);
  const outRoot = process.env.CLINICAL_ENTRY_OUT ?? 'dist';

  return {
    plugins: [react()],
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      outDir: `${outRoot}/portals/clinical/${release}`,
      emptyOutDir: true,
      copyPublicDir: false,
      lib: {
        entry: 'src/clinical/entry.tsx',
        formats: ['es'],
        fileName: () => 'entry.js',
        cssFileName: 'entry',
      },
    },
  };
});
