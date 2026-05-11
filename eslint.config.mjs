import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Allow any type in limited cases (charts, API responses)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow empty interfaces
      '@typescript-eslint/no-empty-object-type': 'off',
      // Allow unused vars prefixed with _
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // React
      'react/display-name': 'off',
    },
  },
];

export default config;
