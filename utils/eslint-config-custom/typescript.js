const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
    extends: ['@vercel/style-guide/eslint/node', '@vercel/style-guide/eslint/typescript'].map(require.resolve),
    parserOptions: {
        project,
    },
    globals: {
        React: true,
        JSX: true,
    },
    settings: {
        'import/resolver': {
            typescript: {
                project,
            },
        },
    },
    ignorePatterns: ['node_modules/', 'dist/'],
    rules: {
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    },
};
