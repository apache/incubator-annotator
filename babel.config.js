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
const { DEFAULT_EXTENSIONS } = require('@babel/core');

module.exports = (api) => {
  const ENV = api.env();
  const DEV = ENV === 'development';
  const TEST = ENV === 'test';
  const CJS = ENV === 'cjs';

  // Options for the @babel/env preset.
  const envOptions = {
    // Use minimal syntax fixes where possible
    // Note: This setting may become the default in Babel 8.
    bugfixes: true,
    // Transform module syntax if necessary.
    modules: CJS || TEST ? 'commonjs' : false,
    // Set target environment to default browsers.
    targets: TEST ? { node: 'current' } : 'defaults',
  };

  // Options for the @babel/typescript preset.
  const typescriptOptions = {
    // Opt in to a Babel 8 default.
    allowDeclareFields: true,
    // Be explicit about type-only imports.
    onlyRemoveTypeImports: true,
  };

  const addImportExtensionOptions = {
    extension: DEV || TEST ? 'ts' : CJS ? 'js' : 'mjs',
  };

  // Options for the module-resolver plugin.
  // Used for resolving source files during development.
  const resolverOptions = {
    alias: {
      ...(DEV || TEST
        ? {
            '^@annotator/([^/]+)$': path.join(
              __dirname,
              'packages/\\1/src/index.ts',
            ),
          }
        : null),
      // TODO: Remove after babel/babel#8462 ships.
      '^@babel/runtime-corejs3/core-js/(.+)$':
        '@babel/runtime-corejs3/core-js/\\1.js',
      '^@babel/runtime-corejs3/core-js-stable/(.+)$':
        '@babel/runtime-corejs3/core-js-stable/\\1.js',
      '^@babel/runtime-corejs3/helpers/(.+)$':
        '@babel/runtime-corejs3/helpers/\\1.js',
      '^@babel/runtime-corejs3/regenerator$':
        '@babel/runtime-corejs3/regenerator/index.js',
    },
    extensions: ['.ts', '.tsx', ...DEFAULT_EXTENSIONS],
  };

  // Options for the @babel/transform-runtime plugin.
  const runtimeOptions = {
    // Use corejs version 3.
    corejs: { version: 3 },
    // Use helpers formatted for the target environment.
    // TODO: Re-enable after babel/babel#8462 ships.
    // useESModules: !CJS && !TEST,
  };

  return {
    plugins: [
      ['@babel/transform-runtime', runtimeOptions],
      ...(TEST ? ['istanbul'] : []),
      ['add-import-extension', addImportExtensionOptions],
      ['module-resolver', resolverOptions],
      'preserve-comment-header',
    ],
    presets: [
      ['@babel/env', envOptions],
      ['@babel/typescript', typescriptOptions],
    ],
  };
};
