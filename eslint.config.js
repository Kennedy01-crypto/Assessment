import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended, //standard JavaScript problems
      tseslint.configs.recommended,// TypeScript problems
      reactHooks.configs.flat.recommended, // Incorrect React Hooks usage
      reactRefresh.configs.vite, //Vite & React fast refresh compatibility
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  prettier,
])
