import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    svelte(),
    webExtension({ manifest: './manifest.json' }),
  ],
  resolve: {
    alias: {
      $shared: resolve(import.meta.dirname, 'src/shared'),
      $api: resolve(import.meta.dirname, 'src/api'),
    },
  },
  test: {
    testTimeout: 15_000,
    exclude: ['tests/e2e/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov'],
      reportsDirectory: 'coverage',
    },
  },
});
