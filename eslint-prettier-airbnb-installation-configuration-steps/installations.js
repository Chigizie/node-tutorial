// 1. Install dependencies

// Run this inside your Node.js project:

// npm install --save-dev \
//   eslint prettier \
//   eslint-config-airbnb-base eslint-plugin-import \
//   eslint-config-prettier eslint-plugin-prettier \
//   @eslint/eslintrc

// Explanation:

// eslint → main linter

// prettier → code formatter

// eslint-config-airbnb-base → Airbnb’s JS rules (no React)

// eslint-plugin-import → required by Airbnb rules

// eslint-config-prettier → disables rules that clash with Prettier

// eslint-plugin-prettier → lets ESLint run Prettier as a rule

// @eslint/eslintrc → provides FlatCompat bridge for old configs

// 2. Create eslint.config.mjs

// At the root of your project:

// // eslint.config.mjs
// import js from "@eslint/js";
// import path from "path";
// import { FlatCompat } from "@eslint/eslintrc";
// import prettierPlugin from "eslint-plugin-prettier";

// // Adapter to use old configs (Airbnb, Prettier) in flat config
// const compat = new FlatCompat({
//   baseDirectory: path.resolve(),
// });

// export default [
//   // ESLint's recommended rules
//   js.configs.recommended,

//   // Airbnb + Prettier configs (converted via FlatCompat)
//   ...compat.extends("airbnb-base"),
//   ...compat.extends("prettier"),

//   {
//     files: ["**/*.js"],
//     plugins: {
//       prettier: prettierPlugin, // enable prettier plugin
//     },
//     languageOptions: {
//       ecmaVersion: "latest",
//       sourceType: "module",
//     },
//     rules: {
//       "prettier/prettier": "error",
//       "no-console": "warn",
//       "consistent-return": "off",
//       "func-names": "off",
//       "object-shorthand": "off",
//       "no-process-exit": "off",
//       "no-param-reassign": "off",
//       "no-return-await": "off",
//       "no-underscore-dangle": "off",
//       "class-methods-use-this": "off",
//       "prefer-destructuring": ["error", { object: true, array: false }],
//       "no-unused-vars": ["warn", { argsIgnorePattern: "req|res|next|val" }]
//     },
//   },
// ];

// 3. Add npm scripts

// In your package.json:

// {
//   "scripts": {
//     "lint": "eslint .",
//     "lint:fix": "eslint . --fix",
//     "format": "prettier --write ."
//   }
// }

// 4. (Optional) Add Prettier config

// Create a prettier.config.mjs to ensure formatting matches ESLint:

// prettier.config.mjs

// export default {
//   semi: true,
//   singleQuote: true,
//   trailingComma: "all",
//   printWidth: 80,
//   tabWidth: 2,
// };

// 5. Run checks

// Lint code:

// npm run lint

// Fix automatically:

// npm run lint:fix

// Format with Prettier:

// npm run format

// ⚡ ESLint + Prettier Setup (Flat Config, Node.js, Airbnb)

// 1. Install everything
// npm install --save-dev eslint prettier eslint-config-airbnb-base eslint-plugin-import eslint-config-prettier eslint-plugin-prettier @eslint/eslintrc

// 2. Create eslint.config.mjs
// import js from "@eslint/js";
// import path from "path";
// import { FlatCompat } from "@eslint/eslintrc";
// import prettierPlugin from "eslint-plugin-prettier";

// const compat = new FlatCompat({
//   baseDirectory: path.resolve(),
// });

// export default [
//   js.configs.recommended,
//   ...compat.extends("airbnb-base"),
//   ...compat.extends("prettier"),
//   {
//     files: ["**/*.js"],
//     plugins: { prettier: prettierPlugin },
//     languageOptions: { ecmaVersion: "latest", sourceType: "module" },
//     rules: {
//       "prettier/prettier": "error",
//       "no-console": "warn",
//       "no-unused-vars": ["warn", { argsIgnorePattern: "req|res|next|val" }],
//     },
//   },
// ];

// 3. Add scripts in package.json
// {
//   "scripts": {
//     "lint": "eslint .",
//     "lint:fix": "eslint . --fix",
//     "format": "prettier --write ."
//   }
// }

// 4. (Optional) Prettier config → prettier.config.mjs
// export default {
//   semi: true,
//   singleQuote: true,
//   trailingComma: "all",
//   printWidth: 80,
//   tabWidth: 2,
// };

// 5. Run
// npm run lint       # check
// npm run lint:fix   # auto-fix
// npm run format     # format with prettier

// ⚡ That’s it. Next time you start a project, just run step 1, drop in eslint.config.mjs and (optionally) prettier.config.mjs, and you’re ready.
