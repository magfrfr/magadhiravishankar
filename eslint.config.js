import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Core no-unused-vars can't see JSX usages like <motion.div>
      'react/jsx-uses-vars': 'error',
    },
  },
  {
    // R3F scene graph: mutating three.js objects inside useFrame is the
    // idiomatic (and required) pattern; the compiler purity rules assume
    // React-managed values and misfire here.
    files: ['src/scene/**/*.{js,jsx}'],
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
    },
  },
])
