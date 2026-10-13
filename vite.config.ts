import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    // Relative base: when dlc-front mounts the remote, CSS and chunks resolve
    // against the remote origin instead of the host page.
    base: './',
    plugins: [
      react(),
      federation({
        name: 'dlc_clinical_portal',
        filename: 'remoteEntry.js',
        // Ship the portal CSS with every exposed module when dlc-front mounts it.
        bundleAllCSS: true,
        exposes: {
          './ClinicalPortal': './src/clinical/ClinicalPortal.tsx',
          './ClinicalDashboard': './src/clinical/ClinicalDashboard.tsx',
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
        },
      }),
    ],
    server: {
      port: Number(env.VITE_PORT || 4173),
      strictPort: true,
    },
  };
});
