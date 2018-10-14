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

module.exports = api => {
  const ENV = api.env() || 'development';
  const DEV = ENV === 'development';
  const TEST = ENV === 'test';
  const CJS = ENV === 'cjs';

  // Options for the @babel/transform-modules-commonjs plugin.
  const cjsOptions = {
    // Disable require default interop.
    noInterop: true,
    // Disable export default interop.
    strict: true,
  };

  // Options for the @babel/env preset.
  const envOptions = {
    // Do not enable automatic module transformation.
    modules: false,
    // Enable proposals that have shipped in browsers.
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

  // Options for the module-resolver plugin.
  // Used for resolving source files during development and testing.
  let resolverOptions = {
    alias: {
      '^(@annotator/.+?)(/|$)': '\\1/src',
    },
  };

  // Options for the @babel/transform-runtime plugin.
  const runtimeOptions = {
    // Use the module format of the target environment.
    // TODO: make this work again
    // useESModules: !CJS,
  };

  return {
    plugins: [
      'preserve-comment-header',
      ['@babel/transform-runtime', runtimeOptions],
      ...(CJS ? [['@babel/transform-modules-commonjs', cjsOptions]] : []),
      ...(DEV || TEST ? [['module-resolver', resolverOptions]] : []),
      ...(TEST ? ['istanbul'] : []),
    ],
    presets: [['@babel/env', envOptions]],
  };
};
