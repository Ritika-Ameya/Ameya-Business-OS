import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/shared/ui/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: [
      'src/features/deals/pages/DealWorkspacePage.tsx',
      'src/features/revenue/pages/InvoiceWorkspacePage.tsx',
      'src/features/expenses/components/AddExpenseMasterDialog.tsx',
      'src/features/expenses/components/AddExpenseTransactionDialog.tsx',
      'src/features/expenses/components/ExpenseRegisterTab.tsx',
    ],
    rules: {
      // Intentional URL/dialog sync — derived state would change tab or form behaviour.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
