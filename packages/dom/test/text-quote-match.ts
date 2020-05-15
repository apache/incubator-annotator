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

const domParser = new window.DOMParser();

const testCases: {
  [name: string]: {
    html: string,
    selector: TextQuoteSelector,
    expected: RangeInfo[],
  }
} = {
  "simple": {
    html: `<b>lorem ipsum dolor amet yada yada</b>`,
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
    },
    expected: [
      {
        startContainer: '//b/text()',
        startOffset: 12,
        endContainer: '//b/text()',
        endOffset: 20,
      },
    ]
  },
};

describe('createTextQuoteSelectorMatcher', () => {
  for (const [name, { html, selector, expected }] of Object.entries(testCases)) {
    it(`works for case: '${name}'`, async () => {
      const doc = domParser.parseFromString(html, 'text/html');
      const matcher = createTextQuoteSelectorMatcher(selector);
      const matches = await asyncIterableToArray(matcher(doc.body));
      assert.deepEqual(
        matches.map(range => canonicalRangeSerialisation(range)),
        expected.map(info => canonicalRangeSerialisation(info, doc)),
      );
    });
  }
});

// RangeInfo encodes a Range’s start&end containers as XPaths.
type RangeInfo = {
  startContainer: string,
  startOffset: number,
  endContainer: string,
  endOffset: number,
};

function canonicalRangeSerialisation(range: Range): RangeInfo
function canonicalRangeSerialisation(range: RangeInfo, doc: Document): RangeInfo
function canonicalRangeSerialisation(range: Range | RangeInfo, doc?: Document): RangeInfo {
  if (!('collapsed' in range)) {
    // range is already serialised; re-serialise to ensure it is canonical.
    return {
      ...range,
      startContainer: createXPath(evaluateXPathOne(doc, range.startContainer)),
      endContainer: createXPath(evaluateXPathOne(doc, range.endContainer)),
    };
  }
  return {
    startContainer: createXPath(range.startContainer),
    startOffset: range.startOffset,
    endContainer: createXPath(range.endContainer),
    endOffset: range.endOffset,
  };
}

function infoToRange(info: RangeInfo | Range, doc: Document): Range {
  if ('collapsed' in info) return info;
  const range = document.createRange();
  range.setStart(evaluateXPathOne(doc, info.startContainer), info.startOffset);
  range.setEnd(evaluateXPathOne(doc, info.startContainer), info.startOffset);
}

async function asyncIterableToArray<T>(source: AsyncIterable<T>): Promise<T[]> {
  const values = [];
  for await (const value of source) {
    values.push(value);
  };
  return values;
}

// Return an XPath expression for the given node.
function createXPath(node: Node): string { // wrap the actual function with a self-test.
  const result = _createXPath(node);
  try {
    const selfCheck = evaluateXPathAll(node.ownerDocument || node as Document, result);
    assert.deepEqual(selfCheck, [node]);
  } catch (err) {
    assert.fail(`Test suite itself created an incorrect XPath: '${result}'`);
  }
  return result;
}
function _createXPath(node: Node): string {
  let path = ''
  while (node.parentNode !== null) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const name = (node as Element).tagName.toLowerCase();
      const matchingElements = evaluateXPathAll(node.ownerDocument || node as Document, `//${name}`);
      if (matchingElements.length > 1)
        return `//${name}[${matchingElements.indexOf(node) + 1}]${path}`;
      else
        return `//${name}${path}`;
    }
    const childIndex = [...node.parentNode.childNodes].indexOf(node as ChildNode);
    const xpathNodeTypes = {
      [Node.COMMENT_NODE]: 'comment',
      [Node.TEXT_NODE]: 'text',
      [Node.PROCESSING_INSTRUCTION_NODE]: 'processing-instruction',
    }
    const nodeType = xpathNodeTypes[node.nodeType] || 'node';
    path = `/${nodeType}()[${childIndex + 1}]` + path;
    node = node.parentNode;
  }
  return path;
}

function evaluateXPathAll(doc: Document, xpath: string): Node[] {
  const result = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
  return new Array(result.snapshotLength).fill(undefined).map((_, i) => result.snapshotItem(i));
}

function evaluateXPathOne(doc: Document, xpath: string): Node {
  const nodes = evaluateXPathAll(doc, xpath);
  assert.equal(nodes.length, 1,
    `Test suite contains XPath with ${nodes.length} results instead of 1: '${xpath}'`
  );
  return nodes[0];
}
