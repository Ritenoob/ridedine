const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['**/dist/**','**/build/**','**/.next/**','**/.turbo/**','**/node_modules/**','**/coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {}
  }
];