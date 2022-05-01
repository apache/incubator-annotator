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
import { ownerDocument } from '../src/owner-document.js';

// RangeInfo serialises a Range’s start and end containers as XPaths.
export type RangeInfo = {
  startContainerXPath: string;
  startOffset: number;
  endContainerXPath: string;
  endOffset: number;
};

export function evaluateXPath(doc: Document, xpath: string): Node {
  const result = doc.evaluate(
    xpath,
    doc,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
  );
  const nodes = new Array(result.snapshotLength)
    .fill(undefined)
    .map((_, i) => result.snapshotItem(i));
  assert.equal(
    nodes.length,
    1,
    `Test suite contains XPath with ${nodes.length} results instead of 1: '${xpath}'`,
  );
  return nodes[0] as Node;
}

export function hydrateRange(rangeInfo: RangeInfo, doc: Document): Range {
  const range = doc.createRange();
  range.setStart(
    evaluateXPath(doc, rangeInfo.startContainerXPath),
    rangeInfo.startOffset,
  );
  range.setEnd(
    evaluateXPath(doc, rangeInfo.endContainerXPath),
    rangeInfo.endOffset,
  );
  return range;
}

export function assertRangeEquals(match: Range, expected: RangeInfo): void {
  const doc = ownerDocument(match);
  if (expected === undefined) {
    assert.fail(`Unexpected match: ${prettyRange(match)}`);
  }
  const expectedStartContainer = evaluateXPath(
    doc,
    expected.startContainerXPath,
  );
  const expectedEndContainer = evaluateXPath(doc, expected.endContainerXPath);
  assert(
    match.startContainer === expectedStartContainer,
    `unexpected start container: ${prettyNodeName(match.startContainer)}; ` +
      `expected ${prettyNodeName(expectedStartContainer)}`,
  );
  assert.equal(match.startOffset, expected.startOffset);
  assert(
    match.endContainer === evaluateXPath(doc, expected.endContainerXPath),
    `unexpected end container: ${prettyNodeName(match.endContainer)}; ` +
      `expected ${prettyNodeName(expectedEndContainer)}`,
  );
  assert.equal(match.endOffset, expected.endOffset);
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

function prettyRange(range: Range): string {
  let s = 'Range(';
  if (
    range.startContainer.nodeType === Node.TEXT_NODE &&
    range.startContainer.parentNode
  )
    s += prettyNodeName(range.startContainer.parentNode) + ' → ';
  s += prettyNodeName(range.startContainer) + `: ${range.startOffset}`;
  if (range.endContainer !== range.startContainer) {
    s += ' … ';
    if (
      range.endContainer.nodeType === Node.TEXT_NODE &&
      range.endContainer.parentNode &&
      range.endContainer.parentNode !== range.startContainer.parentNode
    )
      s += prettyNodeName(range.endContainer.parentNode) + ' → ';
    s += prettyNodeName(range.endContainer) + ' : ';
  } else {
    s += '…';
  }
  s += range.endOffset;
  s += ')';
  return s;
}
