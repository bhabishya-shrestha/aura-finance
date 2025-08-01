module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs", "scripts/**/*"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: "18.2",
    },
  },
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "warn",
    "no-unused-vars": ["error", { varsIgnorePattern: "^React$" }],
  },
  overrides: [
    {
      files: ["src/contexts/**/*.jsx"],
      rules: {
        "react-refresh/only-export-components": "off",
      },
    },
    {
      files: ["src/services/plaidService.js"],
      rules: {
        "no-useless-catch": "off",
      },
    },
  ],
};
