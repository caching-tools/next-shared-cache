import { globalIgnores } from 'eslint/config';
import pluginNext from '@next/eslint-plugin-next';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import baseEslintConfig from './base.js';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("typescript-eslint").ConfigArray}
 * */
export const nextJsConfig = tseslint.config(
  globalIgnores(['**/.next']),
  baseEslintConfig,
  {
    extends: [
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat['jsx-runtime'],
    ],
    rules: {
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  pluginReactHooks.configs['recommended-latest'],
  {
    plugins: {
      '@next/next': pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },
  {
    rules: {
      'check-file/filename-naming-convention': 'off',
      'check-file/folder-naming-convention': 'off',
    },
  },
);
