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
const webpack = require('webpack');

module.exports = {
  context: path.resolve(__dirname),
  entry: {
    demo: './demo/index.js',
    test: [
      'chai/register-assert',
      'mocha-loader!multi-entry-loader?include=./packages/*/test!',
    ],
    common: ['webpack/hot/only-dev-server', 'webpack-dev-server/client'],
  },
  devServer: {
    contentBase: path.resolve(__dirname),
    host: 'localhost',
    port: 8080,
    hot: true,
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  resolve: {
    alias: {
      '@annotator': path.resolve(__dirname, 'packages/'),
    },
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: module => {
        return module.context && /node_modules/.test(module.context);
      },
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity,
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
  output: {
    filename: '[name].js',
    publicPath: '/',
  },
};
