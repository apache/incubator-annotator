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
 *
 * SPDX-FileCopyrightText: The Apache Software Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');
const { resolvePath } = require('babel-plugin-module-resolver');

const packagePath = path.join(__dirname, 'packages');

module.exports = (api) => {
  const ENV = api.env();
  const DEV = ENV === 'development';
  const TEST = ENV === 'test';

  // Options for the @babel/env preset.
  const envOptions = {
    // Use minimal syntax fixes where possible
    // Note: This setting may become the default in Babel 8.
    bugfixes: true,
    // Do not transform module syntax.
    modules: false,
  };

  // Options for the @babel/typescript preset.
  const typescriptOptions = {
    // Opt in to a Babel 8 default.
    allowDeclareFields: true,
    // Be explicit about type-only imports.
    onlyRemoveTypeImports: true,
  };

  // Options for the module-resolver plugin.
  // Used for resolving source files during development.
  const resolverOptions = {
    ...(DEV || TEST
      ? {
          alias: {
            '^@apache-annotator/([^/]+)$': ([, name]) =>
              path.join(packagePath, name, 'src', 'index.ts'),
          },
          resolvePath(sourcePath, currentFile, opts) {
            if (
              currentFile.startsWith(packagePath) &&
              currentFile.endsWith('.ts') &&
              sourcePath.startsWith('.') &&
              sourcePath.endsWith('.js')
            ) {
              return sourcePath.replace(/\.js$/, '.ts');
            }
            return resolvePath(sourcePath, currentFile, opts);
          },
        }
      : null),
  };

  // Options for the @babel/transform-runtime plugin.
  const runtimeOptions = {
    // Use corejs version 3.
    corejs: { version: 3, proposals: true },
  };

  return {
    plugins: [
      '@babel/plugin-proposal-class-properties',
      ['@babel/transform-runtime', runtimeOptions],
      ['module-resolver', resolverOptions],
      'preserve-comment-header',
      ...(TEST ? ['istanbul'] : []),
    ],
    presets: [
      ['@babel/env', envOptions],
      ['@babel/typescript', typescriptOptions],
    ],
    targets: {
      browsers: 'defaults',
      esmodules: true,
      node: TEST ? 'current' : '14.15',
    },
  };
};
