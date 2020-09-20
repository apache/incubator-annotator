/**
 * @license
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const babel = require('@babel/core');

// Use the root babel.config.js for module resolution.
// Relevant issue: tleunen/eslint-import-resolver-babel-module#89
const babelConfig = babel.loadPartialConfig({ cwd: __dirname });
const babelModuleResolver = babelConfig.options.plugins.find(
  (item) => item.file.request === 'module-resolver',
);

module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  plugins: ['import', 'prettier'],
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
      },
    ],
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-absolute-path': 'error',
    'import/no-default-export': 'error',
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
        },
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'never',
      },
    ],
    'import/unambiguous': 'error',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
  },
  settings: {
    'import/internal-regex': '^@annotator/',
    'import/resolver': {
      'babel-module': babelModuleResolver.options,
    },
  },
  overrides: [
    {
      files: [
        '.eslintrc.js',
        '.mocharc.js',
        'babel-register.js',
        'babel.config.js',
        'husky.config.js',
        'nyc.config.js',
        'web/webpack.config.js',
      ],
      env: {
        es2017: true,
        node: true,
      },
      plugins: ['node'],
      rules: {
        'no-console': 'off',
        'import/no-default-export': 'off',
        'import/unambiguous': 'off',
        'node/no-unsupported-features': 'error',
      },
    },
    {
      files: ['**/*.ts'],
      env: {
        es2020: true,
        'shared-node-browser': true,
      },
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/typescript',
        'prettier/@typescript-eslint',
      ],
      parserOptions: {
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/require-await': 'off',
      },
    },
    {
      files: ['**/@types/**/*.d.ts'],
      rules: {
        'import/no-default-export': 'off',
        'import/unambiguous': 'off',
      },
    },
    {
      files: ['packages/*/test/**/*.ts', 'test/**/*.ts'],
      env: {
        mocha: true,
      },
      globals: {
        assert: true,
      },
      rules: {
        'import/no-relative-parent-imports': 'off',
      },
    },
    {
      files: ['packages/dom/**/*.js'],
      env: {
        browser: true,
      },
    },
    {
      files: ['web/demo/**/*.js'],
      env: {
        browser: true,
        es2020: true,
      },
      parserOptions: {
        sourceType: 'module',
      },
    },
  ],
};
