import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
// import globals from 'globals';

export default tseslint.config(
  { ignores: ["**/build/**/*", "*.js", "*.mjs", "**/.husky/*"] },
  {
    ...eslint.configs.recommended,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: './',
      },
    }
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    }
  },
);