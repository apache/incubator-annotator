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
    html: `<!doctype html><html><head></head><body><b>lorem ipsum dolor amet yada yada</b></body></html>`,
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
    },
    expected: [
      {
        startContainer: [1, 1, 0, 0],
        startOffset: 12,
        endContainer: [1, 1, 0, 0],
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
      assert.deepEqual(matches.map(rangeToInfo), expected);
    });
  }
});

// RangeInfo encodes a Range’s start&end containers as their positions in the DOM tree.
type RangeInfo = {
  startContainer: number[],
  startOffset: number,
  endContainer: number[],
  endOffset: number,
};

function rangeToInfo(range: Range | RangeInfo): RangeInfo {
  if (!('collapsed' in range)) return range;
  return {
    startContainer: pathToNode(range.startContainer),
    startOffset: range.startOffset,
    endContainer: pathToNode(range.endContainer),
    endOffset: range.endOffset,
  };
}

async function asyncIterableToArray<T>(source: AsyncIterable<T>): Promise<T[]> {
  const values = [];
  for await (const value of source) {
    values.push(value);
  };
  return values;
}

// Return the array of child indexes that leads from the root node to the given node.
function pathToNode(node: Node): number[] {
  const path: number[] = [];
  while (node.parentNode !== null) {
    path.unshift([...node.parentNode.childNodes].indexOf(node as ChildNode));
    node = node.parentNode;
  }
  return path;
}
