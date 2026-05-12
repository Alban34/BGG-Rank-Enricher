// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sveltePlugin from 'eslint-plugin-svelte';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'svelte.config.js'] },

  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...sveltePlugin.configs['flat/recommended'],

  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.svelte'],
      },
    },
  },

  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  {
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
