// this file is going to check code quality mistakes, more strictly than Typecript. Can see mistakes while typying. 

import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {  argsIgnorePattern: "^_", },
      ],
    },
  },
);