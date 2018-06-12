/* global require, process, describe, before, it, assert */

import fs from 'fs';
import URL from 'url';

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

describe('Test schemas', () => {
  let data = '';

  before(function() {
    if (!found_url) {
      this.skip();
    } else {
      // load the data from the file or URL
      let url_parsed = URL.parse(url);
      if (url_parsed.path !== url_parsed.href) {
        // TODO: GET the URL's JSON and use that
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
