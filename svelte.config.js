import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    // Enforce Svelte 5 runes mode — no legacy $: reactive statements or export let props.
    runes: true,
  },
};
