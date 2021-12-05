/**
 * SPDX-FileCopyrightText: 2016-2021 The Apache Software Foundation
 * SPDX-License-Identifier: Apache-2.0
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

module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  plugins: ['import', 'prettier'],
  rules: {
    'import/extensions': ['error', 'ignorePackages'],
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
    'no-constant-condition': 'off',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
  },
  settings: {
    'import/internal-regex': '^@apache-annotator/',
    'import/resolver': {
      'babel-module': {
        babelOptions: {
          root: __dirname,
        },
      },
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
      globals: {
        globalThis: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 2019,
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
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/typescript',
        'prettier/@typescript-eslint',
      ],
      parserOptions: {
        ecmaVersion: 2020,
        project: ['./tsconfig.test.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
        EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
      },
      plugins: ['@typescript-eslint'],
      rules: {
        'import/no-unresolved': 'off',
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-duplicate-imports': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
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
      rules: {
        'import/no-relative-parent-imports': 'off',
      },
    },
    {
      files: ['web/**/*.js'],
      env: {
        browser: true,
        es2020: true,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
  ],
};
