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

import type { TextQuoteSelector } from '../../src';
import { createTextQuoteSelectorMatcher } from '../../src/text-quote/match';
import { evaluateXPath, RangeInfo } from '../utils';

import { testCases } from './match-cases';

const domParser = new window.DOMParser();

describe('createTextQuoteSelectorMatcher', () => {
  for (const [name, { html, selector, expected }] of Object.entries(
    testCases,
  )) {
    it(`works for case: '${name}'`, async () => {
      const doc = domParser.parseFromString(html, 'text/html');

      const scope = doc.createRange();
      scope.selectNodeContents(doc);

      await testMatcher(doc, scope, selector, expected);
    });
  }

  it('handles adjacent text nodes', async () => {
    const { html, selector } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.selectNodeContents(doc);

    const textNode = evaluateXPath(doc, '//b/text()') as Text;

    for (let index = textNode.length - 1; index > 0; index--)
      textNode.splitText(index);
    // console.log([...textNode.parentNode.childNodes].map(node => node.textContent))
    // → 'l',  'o', 'r', 'e', 'm', …

    await testMatcher(doc, scope, selector, [
      {
        startContainerXPath: '//b/text()[13]',
        startOffset: 0,
        endContainerXPath: '//b/text()[21]',
        endOffset: 0,
      },
    ]);
  });

  it('handles empty text nodes', async () => {
    const { html, selector } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.selectNodeContents(doc);

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

    await testMatcher(doc, scope, selector, [
      {
        startContainerXPath: '//b/text()[4]', // "dolor"
        startOffset: 0,
        endContainerXPath: '//b/text()[8]', // "et yada yada"
        endOffset: 0,
      },
    ]);
  });

  it('works with parent of text as scope', async () => {
    const { html, selector, expected } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.selectNodeContents(evaluateXPath(doc, '//b'));

    await testMatcher(doc, scope, selector, expected);
  });

  it('works with parent of text as scope, when matching its first characters', async () => {
    const { html, selector, expected } = testCases['first characters'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.selectNodeContents(evaluateXPath(doc, '//b'));

    await testMatcher(doc, scope, selector, expected);
  });

  it('works with parent of text as scope, when matching its first characters, with an empty text node', async () => {
    const { html, selector } = testCases['first characters'];
    const doc = domParser.parseFromString(html, 'text/html');

    const scope = doc.createRange();
    scope.selectNodeContents(evaluateXPath(doc, '//b'));

    const textNode = evaluateXPath(doc, '//b/text()') as Text;
    textNode.splitText(0);

    await testMatcher(doc, scope, selector, [
      {
        startContainerXPath: '//b/text()[2]',
        startOffset: 0,
        endContainerXPath: '//b/text()[2]',
        endOffset: 11,
      },
    ]);
  });

  it('works when scope is a Range within one text node', async () => {
    const { html, selector, expected } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');

    // Use the substring ‘ipsum dolor amet’ as scope.
    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b/text()'), 6);
    scope.setEnd(evaluateXPath(doc, '//b/text()'), 22);
    await testMatcher(doc, scope, selector, expected);
  });

  it('works when scope is a Range with both ends inside text nodes', async () => {
    const { html, selector, expected } = testCases['across elements'];
    const doc = domParser.parseFromString(html, 'text/html');

    // Use the substring ‘sum dolor am’ as scope.
    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//i/text()'), 2);
    scope.setEnd(evaluateXPath(doc, '//u/text()'), 2);
    await testMatcher(doc, scope, selector, expected);
  });

  it('works when scope is a Range with both ends inside elements', async () => {
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
  scope: Range,
  selector: TextQuoteSelector,
  expected: RangeInfo[],
) {
  const matcher = createTextQuoteSelectorMatcher(selector);
  const matches = [];
  for await (const value of matcher(scope)) matches.push(value);
  assert.equal(matches.length, expected.length);
  matches.forEach((match, i) => {
    const expectedRange = expected[i];
    const expectedStartContainer = evaluateXPath(
      doc,
      expectedRange.startContainerXPath,
    );
    const expectedEndContainer = evaluateXPath(
      doc,
      expectedRange.endContainerXPath,
    );
    assert(
      match.startContainer === expectedStartContainer,
      `unexpected start container: ${prettyNodeName(match.startContainer)}; ` +
        `expected ${prettyNodeName(expectedStartContainer)}`,
    );
    assert.equal(match.startOffset, expectedRange.startOffset);
    assert(
      match.endContainer ===
        evaluateXPath(doc, expectedRange.endContainerXPath),
      `unexpected end container: ${prettyNodeName(match.endContainer)}; ` +
        `expected ${prettyNodeName(expectedEndContainer)}`,
    );
    assert.equal(match.endOffset, expectedRange.endOffset);
  });
}

function prettyNodeName(node: Node) {
  switch (node.nodeType) {
    case Node.TEXT_NODE: {
      const text = (node as Text).nodeValue || '';
      return `#text "${text.length > 50 ? text.substring(0, 50) + '…' : text}"`;
    }
    case Node.ELEMENT_NODE:
      return `<${(node as Element).tagName.toLowerCase()}>`;
    default:
      return node.nodeName.toLowerCase();
  }
}
