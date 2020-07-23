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

const path = require('path');

const babel = require('@babel/core');

// Use the root babel.config.js for module resolution.
// Relevant issue: tleunen/eslint-import-resolver-babel-module#89
const babelConfig = babel.loadPartialConfig({ cwd: __dirname });
const babelModuleResolver = babelConfig.options.plugins.find(
  item => item.file.request === 'module-resolver',
);

module.exports = {
  root: true,
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
  },
  overrides: [
    {
      files: [
        '.eslintrc.js',
        '.mocharc.js',
        'babel.config.js',
        'husky.config.js',
        'nyc.config.js',
      ],
      env: {
        es2017: true,
        node: true,
      },
      plugins: ['node'],
      rules: {
        'no-console': 'off',
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
        'plugin:import/recommended',
        'plugin:import/typescript',
      ],
      parserOptions: {
        ecmaVersion: 2020,
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint', 'import'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ],

        'import/extensions': [
          'error',
          'ignorePackages',
          {
            ts: 'never',
          },
        ],
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-default-export': 'error',
        'import/no-internal-modules': 'error',
        'import/no-relative-parent-imports': 'error',
        'import/order': ['error', { 'newlines-between': 'always' }],
        'import/unambiguous': 'error',
      },
      settings: {
        'import/resolver': {
          'babel-module': babelModuleResolver.options,
        },
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
      parserOptions: {
        project: ['./tsconfig.tests.json'],
      },
      rules: {
        'import/no-internal-modules': [
          'error',
          {
            allow: [
              'ajv/lib/refs/json-schema-draft-04.json',
              path.resolve(__dirname, './packages/*/src/**'),
            ],
          },
        ],
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
