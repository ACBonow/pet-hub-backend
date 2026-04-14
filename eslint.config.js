// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Permite any com comentário explicativo (já usado no projeto)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Permite imports de require() dentro de factories de mock (jest.mock)
      '@typescript-eslint/no-require-imports': 'warn',
      // Variáveis não usadas como erro, exceto args prefixados com _
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Ignorar arquivos gerados e de build
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
)
