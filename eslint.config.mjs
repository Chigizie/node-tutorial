// // eslint.config.mjs
// import js from '@eslint/js';
// import path from 'path';
// import { FlatCompat } from '@eslint/eslintrc';
// import prettierPlugin from 'eslint-plugin-prettier';

// const compat = new FlatCompat({
//   baseDirectory: path.resolve(),
// });

// export default [
//   js.configs.recommended,

//   // Airbnb and Prettier configs (old style, adapted)
//   ...compat.extends('airbnb-base'),
//   ...compat.extends('prettier'),

//   {
//     files: ['**/*.js'],
//     plugins: {
//       prettier: prettierPlugin, // 👈 load plugin here
//     },
//     languageOptions: {
//       ecmaVersion: 'latest',
//       sourceType: 'module',
//     },

//     rules: {
//       'prettier/prettier': 'error', // now ESLint knows where it comes from
//       'no-console': 'warn',
//       'consistent-return': 'off',
//       'func-names': 'off',
//       'object-shorthand': 'off',
//       'no-process-exit': 'off',
//       'no-param-reassign': 'off',
//       'no-return-await': 'off',
//       'no-underscore-dangle': 'off',
//       'class-methods-use-this': 'off',
//       'prefer-destructuring': ['error', { object: true, array: false }],
//       'no-unused-vars': ['warn', { argsIgnorePattern: 'req|res|next|val' }],
//     },
//   },
// ];

// import js from '@eslint/js';
// import path from 'path';
// import { FlatCompat } from '@eslint/eslintrc';
// import prettierPlugin from 'eslint-plugin-prettier';
// import globals from 'globals';
// import nodePlugin from 'eslint-plugin-node';

// const compat = new FlatCompat({
//   baseDirectory: path.resolve(),
// });

// export default [
//   js.configs.recommended,
//   ...compat.extends('airbnb-base'),
//   ...compat.extends('prettier'),
//   {
//     files: ['**/*.js', '**/*.mjs'],
//     plugins: {
//       prettier: prettierPlugin,
//       node: nodePlugin,
//     },
//     languageOptions: {
//       ecmaVersion: 'latest',
//       sourceType: 'module',
//       globals: {
//         ...globals.node,
//       },
//     },
//     rules: {
//       'linebreak-style': ['error', 'unix'], // Matches .prettierrc
//       'prettier/prettier': [
//         'error',
//         {
//           singleQuote: true,
//           semi: true,
//           trailingComma: 'es5',
//           printWidth: 80,
//           endOfLine: 'lf',
//         },
//       ],
//       'no-console': 'warn',
//       'consistent-return': 'off',
//       'func-names': 'off',
//       'object-shorthand': 'off',
//       'no-process-exit': 'off',
//       'no-param-reassign': 'off',
//       'no-return-await': 'off',
//       'no-underscore-dangle': 'off',
//       'class-methods-use-this': 'off',
//       'prefer-destructuring': ['error', { object: true, array: false }],
//       'no-unused-vars': ['warn', { argsIgnorePattern: 'req|res|next|val' }],
//     },
//   },
// ];

// eslint.config.mjs
import js from '@eslint/js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettierPlugin from 'eslint-plugin-prettier';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: resolve(__dirname),
});

export default [
  js.configs.recommended,

  // Airbnb base config (for Node.js)
  ...compat.extends('airbnb-base'),

  // Prettier config
  ...compat.extends('prettier'),

  {
    files: ['**/*.js', '**/*.mjs'],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'warn',
      'consistent-return': 'off',
      'func-names': 'off',
      'object-shorthand': 'off',
      'no-process-exit': 'off',
      'no-param-reassign': 'off',
      'no-return-await': 'off',
      'no-underscore-dangle': 'off',
      'class-methods-use-this': 'off',
      'prefer-destructuring': [
        'error',
        {
          object: true,
          array: false,
        },
      ],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: 'req|res|next|val',
        },
      ],
      // Allow importing devDependencies in config files
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['**/*.config.*', '**/*.test.*', '**/test/**'],
        },
      ],
    },
  },
];
