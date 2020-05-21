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
import { createTextQuoteSelectorMatcher } from '../src/text-quote/match';
import { TextQuoteSelector } from '../../selector/src';
import { DomScope } from '../src/types';

const domParser = new window.DOMParser();

// RangeInfo serialises a Range’s start and end containers as XPaths.
type RangeInfo = {
  startContainerXPath: string,
  startOffset: number,
  endContainerXPath: string,
  endOffset: number,
};

const testCases: {
  [name: string]: {
    html: string,
    selector: TextQuoteSelector,
    expected: RangeInfo[],
  }
} = {
  'simple': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 12,
        endContainerXPath: '//b/text()',
        endOffset: 20,
      },
    ]
  },
  'across elements': {
    html: '<b>lorem <i>ipsum dolor</i> amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
    },
    expected: [
      {
        startContainerXPath: '//i/text()',
        startOffset: 6,
        endContainerXPath: '//b/text()[2]',
        endOffset: 3,
      },
    ]
  },
  'exact element contents': {
    html: '<b>lorem <i>ipsum dolor</i> amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'ipsum dolor',
    },
    expected: [
      {
        startContainerXPath: '//i/text()',
        startOffset: 0,
        endContainerXPath: '//b/text()[2]',
        endOffset: 0,
      },
    ]
  },
  'text inside <head>': {
    html: '<head><title>The title</title></head><b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'title',
    },
    expected: [
      {
        startContainerXPath: '//title/text()',
        startOffset: 4,
        endContainerXPath: '//b/text()[1]',
        endOffset: 0,
      },
    ]
  },
  'two matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'yada',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 23,
        endContainerXPath: '//b/text()',
        endOffset: 27,
      },
      {
        startContainerXPath: '//b/text()',
        startOffset: 28,
        endContainerXPath: '//b/text()',
        endOffset: 32,
      },
    ]
  },
  'overlapping matches': {
    html: '<b>bananas</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'ana',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 1,
        endContainerXPath: '//b/text()',
        endOffset: 4,
      },
      {
        startContainerXPath: '//b/text()',
        startOffset: 3,
        endContainerXPath: '//b/text()',
        endOffset: 6,
      },
    ]
  },
};

describe('createTextQuoteSelectorMatcher', () => {
  for (const [name, { html, selector, expected }] of Object.entries(testCases)) {
    it(`works for case: '${name}'`, async () => {
      const doc = domParser.parseFromString(html, 'text/html');
      await testMatcher(doc, doc, selector, expected);
    });
  }
});

async function testMatcher(
  doc: Document,
  scope: DomScope,
  selector: TextQuoteSelector,
  expected: RangeInfo[]
) {
  const matcher = createTextQuoteSelectorMatcher(selector);
  const matches = [];
  for await (const value of matcher(scope))
    matches.push(value);
  assert.equal(matches.length, expected.length);
  matches.forEach((match, i) => {
    const expectedRange = expected[i];
    assert.include(match, {
      startContainer: evaluateXPath(doc, expectedRange.startContainerXPath),
      startOffset: expectedRange.startOffset,
      endContainer: evaluateXPath(doc, expectedRange.endContainerXPath),
      endOffset: expectedRange.endOffset,
    });
  });
}

function evaluateXPath(doc: Document, xpath: string): Node {
  const result = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
  const nodes = new Array(result.snapshotLength).fill(undefined).map((_, i) => result.snapshotItem(i));
  assert.equal(nodes.length, 1,
    `Test suite contains XPath with ${nodes.length} results instead of 1: '${xpath}'`
  );
  return nodes[0];
}
