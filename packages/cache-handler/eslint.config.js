import baseEslintConfig from '@repo/eslint-config/base';
import libEslintConfig from '@repo/eslint-config/lib';
import vitestEslintConfig from '@repo/eslint-config/vitest';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  baseEslintConfig,
  vitestEslintConfig,
  libEslintConfig,
);
