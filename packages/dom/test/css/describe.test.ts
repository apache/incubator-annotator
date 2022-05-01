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

import { strict as assert } from 'assert';
import { describeCss } from '../../src/css.js';
import { evaluateXPath } from '../utils.js';
import { testCases } from './match-cases.js';

const domParser = new DOMParser();

describe('describeCss', () => {
  describe('inverts test cases of css matcher', () => {
    for (const [name, { html, scopeXPath, expected }] of Object.entries(
      testCases,
    )) {
      for (let i = 0; i < expected.length; i++) {
        const elementXPath = expected[i];
        it(`case: '${name}' (${i + 1}/${expected.length})`, async () => {
          const doc = domParser.parseFromString(html, 'text/html');
          const element = evaluateXPath(doc, elementXPath) as HTMLElement;
          const scopeElement = scopeXPath
            ? (evaluateXPath(doc, scopeXPath) as HTMLElement)
            : undefined;
          const cssSelector = await describeCss(element, scopeElement);

          // We do not require a specific value for the selector, just
          // that it uniquely matches the same element again.
          const matchingElements = (scopeElement ?? doc).querySelectorAll(
            cssSelector.value,
          );
          assert.equal(
            matchingElements.length,
            1,
            'Expected a selector with a single match',
          );
          assert.equal(matchingElements[0], element);
        });
      }
    }
  });
});
