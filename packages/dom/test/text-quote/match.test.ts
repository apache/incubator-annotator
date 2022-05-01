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
import type { TextQuoteSelector } from '@apache-annotator/selector';
import { createTextQuoteSelectorMatcher } from '../../src/text-quote/match.js';
import { evaluateXPath, assertRangeEquals } from '../utils.js';
import type { RangeInfo } from '../utils.js';
import { testCases } from './match-cases.js';

const domParser = new DOMParser();

describe('createTextQuoteSelectorMatcher', () => {
  for (const [name, { html, selector, expected }] of Object.entries(
    testCases,
  )) {
    it(`works for case: '${name}'`, async () => {
      const doc = domParser.parseFromString(html, 'text/html');
      await testMatcher(doc, doc, selector, expected);
    });
  }

  describe.skip('Is resistant to splitting text nodes', () => {
    for (const [name, { html, selector, expected }] of Object.entries(
      testCases,
    )) {
      it(`for case: '${name}'`, async () => {
        const doc = domParser.parseFromString(html, 'text/html');
        await testMatcher(doc, doc, selector, expected, true);
      });
    }
  });

  it('handles adjacent text nodes', async () => {
    const { html, selector } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');
    const textNode = evaluateXPath(doc, '//b/text()') as Text;

    for (let index = textNode.length - 1; index > 0; index--)
      textNode.splitText(index);
    // console.log([...textNode.parentNode.childNodes].map(node => node.textContent))
    // → 'l',  'o', 'r', 'e', 'm', …

    await testMatcher(doc, doc, selector, [
      {
        startContainerXPath: '//b/text()[13]',
        startOffset: 0,
        endContainerXPath: '//b/text()[20]',
        endOffset: 1,
      },
    ]);
  });

  it('handles empty text nodes', async () => {
    const { html, selector } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');
    const textNode = evaluateXPath(doc, '//b/text()') as Text;
    textNode.splitText(textNode.length);
    textNode.splitText(20);
    textNode.splitText(20);
    textNode.splitText(17);
    textNode.splitText(17);
    textNode.splitText(12);
    textNode.splitText(12);
    textNode.splitText(0);
    // console.log([...textNode.parentNode.childNodes].map(node => node.textContent))
    // → '', 'lorem ipsum ', '', 'dolor', '', ' am', '', 'et yada yada', ''

    await testMatcher(doc, doc, selector, [
      {
        startContainerXPath: '//b/text()[4]', // "dolor"
        startOffset: 0,
        endContainerXPath: '//b/text()[6]', // " am"
        endOffset: 3,
      },
    ]);
  });

  it('works when scope spans one text node’s contents, matching its first characters', async () => {
    const { html, selector, expected } = testCases['first characters'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.selectNodeContents(evaluateXPath(doc, '//b/text()'));

    await testMatcher(doc, scope, selector, expected);
  });

  it('works when scope starts with an empty text node, matching its first characters', async () => {
    const { html, selector } = testCases['first characters'];
    const doc = domParser.parseFromString(html, 'text/html');

    const textNode = evaluateXPath(doc, '//b/text()') as Text;
    textNode.splitText(0);

    const scope = doc.createRange();
    scope.selectNodeContents(evaluateXPath(doc, '//b'));

    await testMatcher(doc, scope, selector, [
      {
        startContainerXPath: '//b/text()[2]',
        startOffset: 0,
        endContainerXPath: '//b/text()[2]',
        endOffset: 11,
      },
    ]);
  });

  it('works when scope has both ends within one text node', async () => {
    const { html, selector, expected } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');

    // Use the substring ‘ipsum dolor amet’ as scope.
    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b/text()'), 6);
    scope.setEnd(evaluateXPath(doc, '//b/text()'), 22);
    await testMatcher(doc, scope, selector, expected);
  });

  it('works when scope has both ends inside text nodes', async () => {
    const { html, selector, expected } = testCases['across elements'];
    const doc = domParser.parseFromString(html, 'text/html');

    // Use the substring ‘sum dolor am’ as scope.
    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//i/text()'), 2);
    scope.setEnd(evaluateXPath(doc, '//u/text()'), 2);
    await testMatcher(doc, scope, selector, expected);
  });

  it('works when scope has both ends inside an element', async () => {
    const { html, selector, expected } = testCases['across elements'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b'), 1); // before the <i>
    scope.setEnd(evaluateXPath(doc, '//b'), 4); // before the " yada yada"
    await testMatcher(doc, scope, selector, expected);
  });

  it('ignores quote when scope is an empty range', async () => {
    const { html, selector } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    await testMatcher(doc, scope, selector, []);
  });

  it('ignores quote extending just beyond scope', async () => {
    const { html, selector } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b/text()'), 0);
    scope.setEnd(evaluateXPath(doc, '//b/text()'), 19);
    await testMatcher(doc, scope, selector, []);
  });

  it('ignores quote starting just before scope', async () => {
    const { html, selector } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b/text()'), 13);
    scope.setEnd(evaluateXPath(doc, '//b/text()'), 32);
    await testMatcher(doc, scope, selector, []);
  });
});

async function testMatcher(
  doc: Document,
  scope: Node | Range,
  selector: TextQuoteSelector,
  expected: RangeInfo[],
  mutateDom = false,
) {
  const matcher = createTextQuoteSelectorMatcher(selector);
  let count = 0;
  for await (const match of matcher(scope)) {
    assertRangeEquals(match, expected[count++]);
    if (mutateDom) {
      const wrapperNode = doc.createElement('mark');
      match.surroundContents(wrapperNode);
    }
  }
  assert.equal(count, expected.length, 'Wrong number of matches.');
}
