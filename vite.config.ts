import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import manifest from './manifest.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    svelte(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      $shared: resolve(import.meta.dirname, 'src/shared'),
      $api: resolve(import.meta.dirname, 'src/api'),
    },
  },
  test: {
    exclude: ['tests/e2e/**', '**/node_modules/**'],
  },
});
