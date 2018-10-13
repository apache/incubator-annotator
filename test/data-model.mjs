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

/* global require, process, describe, before, it, assert */

import fs from 'fs';
import URL from 'url';
import fetch from 'node-fetch';

import Ajv from 'ajv';
const ajv = new Ajv({ schemaId: 'auto' });
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

// add defintion files to available schemas
const defs = fs.readdirSync('node_modules/web-annotation-tests/definitions/');
defs.forEach(def => {
  if (def.substr(-4) === 'json')
    ajv.addSchema(require('web-annotation-tests/definitions/' + def));
});

// file or URL location
let url = '';
// find the URL parameter (which might be a relative path to a file)
let found_url = false;
process.argv.forEach((val, index) => {
  if (val.startsWith('--url')) {
    found_url = true;
    if (val[5] === '=') {
      url = val.split('=')[1];
    } else {
      // assume the next parameter is a URL
      url = process.argv[index + 1];
    }
  }
});

// load the annotationMusts test list
const musts = JSON.parse(
  fs.readFileSync(
    'node_modules/web-annotation-tests/annotations/annotationMusts.test'
  )
);

describe('Test JSON against Schemas', () => {
  let data = '';

  before(async function() {
    if (!found_url) {
      this.skip();
    } else {
      // load the data from the file or URL
      let url_parsed = URL.parse(url);
      if (url_parsed.path !== url_parsed.href) {
        const data_response = await fetch(url_parsed.href);
        data = await data_response.json();
      } else {
        // assume we have a local file and use that
        data = JSON.parse(fs.readFileSync(url_parsed.path, 'utf8'));
      }
      if (data === '') {
        this.skip();
      }
    }
  });

  musts.assertions.forEach(path => {
    const schema = require('web-annotation-tests/' + path);
    it(schema.title, () => {
      let valid = ajv.validate(schema, data);
      assert.isOk(valid, ajv.errorsText());
    });
  });
});
