// @flow
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

import fs from 'fs';
import path from 'path';
import url from 'url';

import chokidar from 'chokidar-socket-emitter';
import express from 'express';
import json from 'core-js/library/fn/json';
import resolve from 'resolve';

import rollup from 'rollup';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import pegjs from 'rollup-plugin-pegjs';

const __moduleUrl = new url.URL(__moduleName);
const __filename = fs.realpathSync(__moduleUrl);
const __dirname = path.dirname(__filename);

const basedir = path.resolve(__dirname, '..');
const packagesPath = path.resolve(basedir, 'packages');
const packages = fs.readdirSync(packagesPath);

const app = express();

packages.forEach(name => {
  const root = path.join(packagesPath, name);
  const entry = path.join(root, 'index.js');
  const dest = path.join(root, `${name}.bundle.js`);
  const external = id => /^@(annotator|hot)/.test(id);

  const jail = path.join(root, 'node_modules');
  const babelOptions = {
    include: ['*.js'],
    exclude: ['*', `${jail}/**`],
    runtimeHelpers: true,
  };

  const plugins = [
    babel(babelOptions),
    commonjs(),
    nodeResolve({ jail }),
    pegjs(),
  ];

  const options = { entry, external, plugins };
  const generateOptions = {
    format: 'amd',
    sourceMap: true,
    sourceMapFile: dest,
  };

  const endpoint = `packages/${name}/${name}.bundle.js`;
  app.get(`/${endpoint}`, (req, res) => {
    rollup
      .rollup(options)
      .then(bundle => {
        const result = bundle.generate(generateOptions);
        const { code, map } = result;
        res.send(`${code}\n//# sourceMappingURL=${map.toUrl()}`);
      })
      .catch(err => {
        console.log(err);
      });
  });
});

app.get('/system.js', (req, res) => {
  const resolved = resolve.sync('systemjs', { basedir });
  const content = fs.readFileSync(resolved);
  res.send(content);
});

app.get('/system-config.js', (req, res) => {
  const packageConfigs = packages.reduce((acc, name) => {
    acc[`packages/${name}`] = { main: `${name}.bundle.js` };
    return acc;
  }, {});

  const map = {
    'systemjs-hmr': 'node_modules/systemjs-hmr',
    'systemjs-hot-reloader': 'node_modules/systemjs-hot-reloader',
    'webcomponents.js': 'node_modules/webcomponents.js',
    '@annotator': 'packages',
    '@hot': '@empty',
  };

  const systemConfig = json.stringify({
    map,
    packages: packageConfigs,
    packageConfigPaths: ['node_modules/*/package.json'],
  });

  res.setHeader('Content-Type', 'application/json');
  res.send(`SystemJS.config(${systemConfig})`);
});

app.use(express.static(basedir));

const server = app.listen(8080, err => {
  if (err) return console.log(err);
  chokidar({
    app: server,
    path: packagesPath,
    relativeTo: packagesPath,
  });
  console.log('Development server running at http://localhost:8080');
});
