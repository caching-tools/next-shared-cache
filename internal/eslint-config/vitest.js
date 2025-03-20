import vitest from '@vitest/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['**/*.test.ts', '**/*.spec.ts'],
  extends: [vitest.configs.all],
  rules: {
    'vitest/prefer-expect-assertions': [
      'error',
      {
        onlyFunctionsWithAsyncKeyword: true,
        onlyFunctionsWithExpectInLoop: true,
        onlyFunctionsWithExpectInCallback: true,
      },
    ],
  },
});
