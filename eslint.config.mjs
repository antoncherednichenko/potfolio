import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores(['.next/**', 'out/**', 'coverage/**', 'next-env.d.ts']),
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/game/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['phaser', 'phaser/*'],
              message:
                'Phaser runtime belongs in src/game; use the client lifecycle adapter.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/game/**/*.{ts,tsx}'],
    ignores: ['src/game/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'next',
                'next/*',
                '@/features/*',
                '@/components/*',
                '*.json',
                '**/*.json',
              ],
              message:
                'Game runtime must stay independent of React, Next.js and portfolio JSON.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/game/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['phaser', 'phaser/*'],
              message: 'Game UI components must not depend on Phaser runtime.',
            },
          ],
        },
      ],
    },
  },
]);
