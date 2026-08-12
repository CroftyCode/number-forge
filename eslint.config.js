import js from '@eslint/js'
import globals from 'globals'

// Deliberately minimal. The job is to catch undefined variables and unused
// bindings, which a Vite build will happily compile and only fail at runtime.
export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z]', args: 'none' }]
    }
  }
]
