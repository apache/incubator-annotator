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
 */

import { assert } from 'chai';
import type { CssSelector } from '@apache-annotator/selector';
import { createCssSelectorMatcher } from '../../src/css';
import { testCases } from './match-cases';
import { evaluateXPath } from '../utils';

const domParser = new DOMParser();

describe('CreateCssSelectorMatcher', () => {
  for (const [name, { html, selector, scopeXPath, expected }] of Object.entries(
    testCases,
  )) {
    it(`works for case: '${name}'`, async () => {
      const doc = domParser.parseFromString(html, 'text/html');

      const scopeElement = scopeXPath ? evaluateXPath(doc, scopeXPath) : doc;
      const scope = doc.createRange();
      scope.selectNodeContents(scopeElement);

      await testMatcher(doc, scope, selector, expected);
    });
  }
});

async function testMatcher(
  doc: Document,
  scope: Range,
  selector: CssSelector,
  expected: string[],
) {
  const matcher = createCssSelectorMatcher(selector);
  const matches = [];
  for await (const value of matcher(scope)) matches.push(value);
  assert.equal(matches.length, expected.length, 'Unexpected number of matches');
  matches.forEach((match, i) => {
    const expectedElement = evaluateXPath(doc, expected[i]);
    // The match should be a Range that exactly contains the expected element.
    assert.equal(match.startContainer.childNodes[match.startOffset], expectedElement);
    assert.equal(match.endContainer, match.startContainer);
    assert.equal(match.endOffset, match.startOffset + 1);
  });
}
