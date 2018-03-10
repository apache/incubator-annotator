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

/* eslint-env node */
/* eslint-disable import/unambiguous */

const path = require('path');

module.exports = {
  context: path.resolve(__dirname),
  entry: {
    demo: './demo/index.js',
    test: [
      'chai/register-assert',
      'mocha-loader!multi-entry-loader?include=./packages/*/test!',
    ],
  },
  devtool: 'inline-source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  output: {
    filename: '[name].js',
    publicPath: '/',
  },
};
