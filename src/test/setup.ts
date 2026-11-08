import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// The full suite shares CPU with jsdom workers; 1 s async queries time out under load.
configure({ asyncUtilTimeout: 5000 });

// Vitest runs without globals, so React Testing Library cannot auto-cleanup.
afterEach(() => {
  cleanup();
});
