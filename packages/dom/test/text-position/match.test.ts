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
import type { TextPositionSelector } from '@apache-annotator/selector';
import { createTextPositionSelectorMatcher } from '../../src/text-position/match.js';
import { evaluateXPath, assertRangeEquals } from '../utils.js';
import type { RangeInfo } from '../utils.js';
import { testCases } from './match-cases.js';

const domParser = new DOMParser();

describe('createTextPositionSelectorMatcher', () => {
  for (const [name, { html, selector, expected }] of Object.entries(
    testCases,
  )) {
    it(`works for case: '${name}'`, async () => {
      const doc = domParser.parseFromString(html, 'text/html');
      await testMatcher(doc, selector, expected);
    });
  }

  it('handles adjacent text nodes', async () => {
    const { html, selector } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');
    const textNode = evaluateXPath(doc, '//b/text()') as Text;

    textNode.splitText(16);
    // console.log([...textNode.parentNode.childNodes].map(node => node.textContent))
    // → [ 'l😃rem ipsum dol', 'or amet yada yada' ]

    await testMatcher(doc, selector, [
      {
        startContainerXPath: '//b/text()[1]',
        startOffset: 13,
        endContainerXPath: '//b/text()[2]',
        endOffset: 5,
      },
    ]);
  });

  it('handles empty text nodes', async () => {
    const { html, selector } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');

    const textNode = evaluateXPath(doc, '//b/text()') as Text;
    textNode.splitText(textNode.length);
    textNode.splitText(21);
    textNode.splitText(21);
    textNode.splitText(18);
    textNode.splitText(18);
    textNode.splitText(13);
    textNode.splitText(13);
    textNode.splitText(0);
    // console.log([...textNode.parentNode.childNodes].map(node => node.textContent))
    // → [ '', 'l😃rem ipsum ', '', 'dolor', '', ' am', '', 'et yada yada', '' ]

    await testMatcher(doc, selector, [
      {
        startContainerXPath: '//b/text()[4]', // "dolor"
        startOffset: 0,
        endContainerXPath: '//b/text()[8]', // "et yada yada"
        endOffset: 0,
      },
    ]);
  });

  it('works when scope spans one text node’s contents, matching its first characters', async () => {
    const { html, selector, expected } = testCases['first characters'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.selectNodeContents(evaluateXPath(doc, '//b/text()'));

    await testMatcher(scope, selector, expected);
  });

  it('works when scope starts with an empty text node, matching its first characters', async () => {
    const { html, selector } = testCases['first characters'];
    const doc = domParser.parseFromString(html, 'text/html');

    const textNode = evaluateXPath(doc, '//b/text()') as Text;
    textNode.splitText(0);

    const scope = doc.createRange();
    scope.selectNodeContents(evaluateXPath(doc, '//b'));

    await testMatcher(scope, selector, [
      {
        startContainerXPath: '//b/text()[2]',
        startOffset: 0,
        endContainerXPath: '//b/text()[2]',
        endOffset: 12,
      },
    ]);
  });

  it('works when scope has both ends within one text node', async () => {
    const { html, expected } = testCases['simple'];

    const doc = domParser.parseFromString(html, 'text/html');

    // Use the substring ‘ipsum dolor amet’ as scope.
    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b/text()'), 7);
    scope.setEnd(evaluateXPath(doc, '//b/text()'), 23);

    const selector: TextPositionSelector = {
      type: 'TextPositionSelector',
      start: 6,
      end: 14,
    };

    await testMatcher(scope, selector, expected);
  });

  it('works when scope has both ends inside text nodes', async () => {
    const { html, expected } = testCases['across elements'];
    const doc = domParser.parseFromString(html, 'text/html');

    // Use the substring ‘sum dolor am’ as scope.
    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//i/text()'), 2);
    scope.setEnd(evaluateXPath(doc, '//u/text()'), 2);

    const selector: TextPositionSelector = {
      type: 'TextPositionSelector',
      start: 4,
      end: 12,
    };

    await testMatcher(scope, selector, expected);
  });

  it('works when scope has both ends inside an element', async () => {
    const { html, expected } = testCases['across elements'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b'), 1); // before the <i>
    scope.setEnd(evaluateXPath(doc, '//b'), 4); // before the " yada yada"
    const selector: TextPositionSelector = {
      type: 'TextPositionSelector',
      start: 6,
      end: 14,
    };
    await testMatcher(scope, selector, expected);
  });
});

async function testMatcher(
  scope: Node | Range,
  selector: TextPositionSelector,
  expected: RangeInfo[],
) {
  const matcher = createTextPositionSelectorMatcher(selector);
  let count = 0;
  for await (const match of matcher(scope)) {
    assertRangeEquals(match, expected[count++]);
  }
  assert.equal(count, expected.length, 'Wrong number of matches.');
}
