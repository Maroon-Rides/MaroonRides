// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json', // <-- needed for type-aware rules
      },
    },
    rules: {
      'no-console': 'warn',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_$',
        },
      ],
    },
  },
  {
    files: ["src/lib/utils/logger.ts"], // path to your logger
    rules: {
      "no-console": "off", // allow console here
    },
  },
]);
