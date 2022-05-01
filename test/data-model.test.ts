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

/* global process */

import { strict as assert } from 'assert';
import fs from 'fs';
import { URL } from 'url';
import Ajv from 'ajv';
import fetch from 'node-fetch';
import resolve from 'resolve';

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

function requireJSON(name: string): Record<string, unknown> {
  const resolvedPath = resolve.sync(name);
  const data = fs.readFileSync(resolvedPath).toString();
  return JSON.parse(data) as Record<string, unknown>;
}

const DEFINITIONS = [
  'annotations',
  'bodyTarget',
  'choiceSet',
  'collections',
  'id',
  'otherProperties',
  'specificResource',
].map((name) => requireJSON(`web-annotation-tests/definitions/${name}.json`));

const MUSTS = requireJSON(
  'web-annotation-tests/annotations/annotationMusts.test',
);

const META_SCHEMA = requireJSON('ajv/lib/refs/json-schema-draft-04.json');

const ajv = new Ajv({ schemaId: 'auto', meta: false });
ajv.addMetaSchema(META_SCHEMA);
DEFINITIONS.forEach((schema) => ajv.addSchema(schema));

describe('Test JSON against Schemas', () => {
  let data: Record<string, unknown>;

  before(async function () {
    if (!found_url) {
      this.skip();
    } else {
      // load the data from the file or URL
      const url_parsed = new URL(url);
      if (url_parsed.pathname !== url_parsed.href) {
        const data_response = await fetch(url_parsed.href);
        data = (await data_response.json()) as Record<string, unknown>;
      } else {
        // assume we have a local file and use that
        data = JSON.parse(
          fs.readFileSync(url_parsed.pathname, 'utf8'),
        ) as Record<string, unknown>;
      }

      if (!data) {
        this.skip();
      }
    }
  });

  const assertions = MUSTS['assertions'] as [string];
  assertions.forEach((schemaPath: string) => {
    const schema = requireJSON(`web-annotation-tests/${schemaPath}`);
    it(schema['title'] as string, () => {
      const valid = ajv.validate(schema, data);
      assert.ok(valid, ajv.errorsText());
    });
  });
});
