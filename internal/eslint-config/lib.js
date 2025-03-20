import jsdoc from 'eslint-plugin-jsdoc';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  extends: [jsdoc.configs['flat/recommended-typescript']],
  rules: {
    'jsdoc/check-indentation': 'error',
    'jsdoc/no-blank-blocks': 'error',
    'jsdoc/require-hyphen-before-param-description': ['error', 'always'],
    'jsdoc/check-tag-names': ['error', { definedTags: ['remarks'] }],
    'jsdoc/tag-lines': [
      'error',
      'always',
      {
        applyToEndTag: false,
        startLines: 1,
      },
    ],
  },
});
