/**
 * @license
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

// Options for the @babel/transform-runtime plugin.
let runtimeOptions = {
  // Do not polyfill; leave that to applications.
  polyfill: false,
  // Do not import polyfills for helpers.
  useBuiltIns: true,
  // Export helpers as ES modules.
  useESModules: process.env.BABEL_ENV !== 'cjs',
};

// Restore old babylon behavior for istanbul.
// https://github.com/babel/babel/pull/6836
// https://github.com/istanbuljs/istanbuljs/issues/119
function hacks() {
  return {
    visitor: {
      Program(programPath) {
        programPath.traverse({
          ArrowFunctionExpression(path) {
            const node = path.node;
            node.expression = node.body.type !== 'BlockStatement';
          },
        });
      },
    },
  };
};

// Options for the @babel/env preset.
let envOptions = {
  // Transform modules if compiling for production.
  modules: process.env.BABEL_ENV === 'cjs' ? 'commonjs' : false,
  // Enabled proposals that have shipped in browsers.
  shippedProposals: true,
  // Set target environments.
  targets: {
    // Browsers: > 1%, last 2 versions, Firefox ESR
    browsers: ['defaults'],
    // Node: LTS
    node: '6.0',
  },
  // Use a minimal @babel/polyfill.
  useBuiltIns: 'entry',
};

const config = {
  plugins: [
    ['@babel/transform-runtime', runtimeOptions],
    ...(process.env.NODE_ENV === 'test' ? [hacks, 'istanbul'] : []),
  ],
  presets: [
    ['@babel/env', envOptions],
  ],
};

module.exports = config;
