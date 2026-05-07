/**
 * Vitest configuration
 * ====================
 * Destination: proj/vitest.config.ts  (project root, next to vite.config.ts)
 *
 * Mirrors the alias and plugin setup from vite.config.ts so imports resolve
 * the same way in tests as they do during the dev build.
 */

import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Use a browser-like DOM environment (required for React component tests).
    environment: 'jsdom',
    // Load jest-dom matchers (toBeInTheDocument, etc.) before every test file.
    setupFiles: ['./src/test-setup.ts'],
    // Allow describe/it/expect without explicit imports (matches Jest convention).
    globals: true,
  },
});
