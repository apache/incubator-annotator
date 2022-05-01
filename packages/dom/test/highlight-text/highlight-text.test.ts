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
import { highlightText } from '../../src/highlight-text.js';
import type { RangeInfo } from '../utils.js';
import { hydrateRange, evaluateXPath } from '../utils.js';

const domParser = new DOMParser();

const testCases: {
  [name: string]: {
    inputHtml: string;
    range: RangeInfo;
    tagName?: string;
    attributes?: Record<string, string>;
    expectedHtml: string;
  };
} = {
  'single text node': {
    inputHtml: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 12,
      endContainerXPath: '//b/text()',
      endOffset: 20,
    },
    expectedHtml: '<b>lorem ipsum <mark>dolor am</mark>et yada yada</b>',
  },
  'across elements': {
    inputHtml: '<b>lorem <i>ipsum</i> dolor <u>amet</u> yada yada</b>',
    range: {
      startContainerXPath: '//b/text()[2]',
      startOffset: 1,
      endContainerXPath: '//u/text()',
      endOffset: 2,
    },
    expectedHtml:
      '<b>lorem <i>ipsum</i> <mark>dolor </mark><u><mark>am</mark>et</u> yada yada</b>',
  },
  'collapsed range': {
    inputHtml: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 12,
      endContainerXPath: '//b/text()',
      endOffset: 12,
    },
    expectedHtml: '<b>lorem ipsum <mark></mark>dolor amet yada yada</b>',
  },
  'custom tag name': {
    inputHtml: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 12,
      endContainerXPath: '//b/text()',
      endOffset: 20,
    },
    tagName: 'span',
    expectedHtml: '<b>lorem ipsum <span>dolor am</span>et yada yada</b>',
  },
  'custom attributes': {
    inputHtml: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 12,
      endContainerXPath: '//b/text()',
      endOffset: 20,
    },
    attributes: {
      class: 'red',
    },
    expectedHtml:
      '<b>lorem ipsum <mark class="red">dolor am</mark>et yada yada</b>',
  },
  'overlapping highlight': {
    // Starts off from the result of the 'single text node' case.
    inputHtml: '<b>lorem ipsum <mark>dolor am</mark>et yada yada</b>',
    range: {
      startContainerXPath: '//mark/text()',
      startOffset: 6,
      endContainerXPath: '//b/text()[2]',
      endOffset: 7,
    },
    tagName: 'mark2',
    expectedHtml:
      '<b>lorem ipsum <mark>dolor <mark2>am</mark2></mark><mark2>et yada</mark2> yada</b>',
  },
};

describe('highlightText', () => {
  for (const [
    name,
    { inputHtml, range, tagName, attributes, expectedHtml },
  ] of Object.entries(testCases)) {
    it(`works for case: ${name}`, () => {
      const doc = domParser.parseFromString(inputHtml, 'text/html');

      // Invoke highlightText for the specified Range, and check the result.
      const removeHighlights = highlightText(
        hydrateRange(range, doc),
        tagName,
        attributes,
      );
      assert.equal(doc.body.innerHTML, expectedHtml);

      // Remove the highlight again and check that we end up exactly how we started.
      removeHighlights();
      assert.equal(doc.body.innerHTML, inputHtml);
    });
  }

  it('works on adjacent text nodes', () => {
    const inputHtml = '<b>lorem ipsum dolor amet yada yada</b>';
    const doc = domParser.parseFromString(inputHtml, 'text/html');

    const textNode = evaluateXPath(doc, '//b/text()') as Text;
    textNode.splitText(15); // after 'dol'

    const range = doc.createRange();
    range.setStart(evaluateXPath(doc, '//b/text()[1]'), 12); // before 'dolor am'
    range.setEnd(evaluateXPath(doc, '//b/text()[2]'), 20 - 15); // after 'dolor am'

    const removeHighlights = highlightText(range);
    const expectedHtml =
      '<b>lorem ipsum <mark>dol</mark><mark>or am</mark>et yada yada</b>';
    assert.equal(doc.body.innerHTML, expectedHtml);

    removeHighlights();
    assert.equal(doc.body.innerHTML, inputHtml);
  });

  it('also marks empty text nodes', () => {
    const inputHtml = '<b>lorem ipsum dolor amet yada yada</b>';
    const doc = domParser.parseFromString(inputHtml, 'text/html');

    const textNode = evaluateXPath(doc, '//b/text()') as Text;
    textNode.splitText(15);
    textNode.splitText(15); // Split the node twice to create an empty text node.

    const range = doc.createRange();
    range.setStart(evaluateXPath(doc, '//b/text()[1]'), 12); // before 'dolor am'
    range.setEnd(evaluateXPath(doc, '//b/text()[3]'), 20 - 15); // after 'dolor am'

    const removeHighlights = highlightText(range);
    const expectedHtml =
      '<b>lorem ipsum <mark>dol</mark><mark></mark><mark>or am</mark>et yada yada</b>';
    assert.equal(doc.body.innerHTML, expectedHtml);

    removeHighlights();
    assert.equal(doc.body.innerHTML, inputHtml);
  });

  it('ignores a range that does not contain Text nodes', () => {
    const inputHtml = `<b>Try highlighting this image: <img> — would that work?</b>`;
    const doc = domParser.parseFromString(inputHtml, 'text/html');

    const range = doc.createRange();
    range.selectNode(evaluateXPath(doc, '//img'));

    const removeHighlights = highlightText(range);
    assert.equal(doc.body.innerHTML, inputHtml);

    removeHighlights();
    assert.equal(doc.body.innerHTML, inputHtml);
  });

  it('correctly removes multiple highlights (fifo order)', () => {
    const { inputHtml, range } = testCases['single text node'];
    const { range: range2, expectedHtml } = testCases['overlapping highlight'];
    const doc = domParser.parseFromString(inputHtml, 'text/html');

    const removeHighlights1 = highlightText(hydrateRange(range, doc));
    const removeHighlights2 = highlightText(hydrateRange(range2, doc), 'mark2');
    assert.equal(doc.body.innerHTML, expectedHtml);

    removeHighlights1();
    removeHighlights2();
    assert.equal(doc.body.innerHTML, inputHtml);
  });

  it('correctly removes multiple highlights (lifo order)', () => {
    const { inputHtml, range } = testCases['single text node'];
    const { range: range2, expectedHtml } = testCases['overlapping highlight'];
    const doc = domParser.parseFromString(inputHtml, 'text/html');

    const removeHighlights1 = highlightText(hydrateRange(range, doc));
    const removeHighlights2 = highlightText(hydrateRange(range2, doc), 'mark2');
    assert.equal(doc.body.innerHTML, expectedHtml);

    removeHighlights2();
    removeHighlights1();
    assert.equal(doc.body.innerHTML, inputHtml);
  });
});
