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

import createNodeIterator from 'dom-node-iterator';
import seek from 'dom-seek';

import { TextQuoteSelector } from '../../../selector/src';
import { DomScope } from '../types';
import { ownerDocument, rangeFromScope } from '../scope';
import { createTextQuoteSelectorMatcher } from './match';

function firstTextNodeInRange(range: Range): Text {
  const { startContainer } = range;

  if (isTextNode(startContainer)) return startContainer;

  const root = range.commonAncestorContainer;
  const iter = createNodeIterator(root, NodeFilter.SHOW_TEXT);
  return iter.nextNode() as Text;
}

export async function describeTextQuote(
  range: Range,
  scope: DomScope = ownerDocument(range).documentElement,
): Promise<TextQuoteSelector> {
  const exact = range.toString();

  const result: TextQuoteSelector = { type: 'TextQuoteSelector', exact };

  const { prefix, suffix } = await calculateContextForDisambiguation(range, result, scope);
  result.prefix = prefix;
  result.suffix = suffix;

  return result
}

async function calculateContextForDisambiguation(
  range: Range,
  selector: TextQuoteSelector,
  scope: DomScope,
): Promise<{ prefix?: string, suffix?: string }> {
  const scopeAsRange = rangeFromScope(scope);
  const root = scopeAsRange.commonAncestorContainer;
  const text = scopeAsRange.toString();

  const matcher = createTextQuoteSelectorMatcher(selector);

  const iter = createNodeIterator(root, NodeFilter.SHOW_TEXT);

  const startNode = firstTextNodeInRange(range);
  const startIndex =
    isTextNode(range.startContainer)
      ? seek(iter, startNode) + range.startOffset
      : seek(iter, startNode);
  const endIndex = startIndex + selector.exact.length;

  const affixLengthPairs: Array<[number, number]> = [];

  for await (const match of matcher(scopeAsRange)) {
    const matchIter = createNodeIterator(root, NodeFilter.SHOW_TEXT);

    const matchStartNode = firstTextNodeInRange(match);
    const matchStartIndex =
      isTextNode(match.startContainer)
        ? seek(matchIter, matchStartNode) + match.startOffset
        : seek(matchIter, matchStartNode);
    const matchEndIndex = matchStartIndex + match.toString().length;

    // If the match is the same as the input range, continue.
    if (matchStartIndex === startIndex || matchEndIndex === endIndex) {
      continue;
    }

    // Determine how many prefix characters are shared.
    const prefixLength = overlapRight(
      text.substring(0, matchStartIndex),
      text.substring(0, startIndex),
    );

    // Determine how many suffix characters are shared.
    const suffixLength = overlap(
      text.substring(matchEndIndex),
      text.substring(endIndex),
    );

    // Record the affix lengths that would have precluded this match.
    affixLengthPairs.push([prefixLength + 1, suffixLength + 1]);
  }

  // Construct and return an unambiguous selector.
  let prefix, suffix;
  if (affixLengthPairs.length) {
    const [prefixLength, suffixLength] = minimalSolution(affixLengthPairs);

    if (prefixLength > 0 && startIndex > 0) {
      prefix = text.substring(startIndex - prefixLength, startIndex);
    }

    if (suffixLength > 0 && endIndex < text.length) {
      suffix = text.substring(endIndex, endIndex + suffixLength);
    }
  }

  return { prefix, suffix };
}

function overlap(text1: string, text2: string) {
  let count = 0;

  while (count < text1.length && count < text2.length) {
    const c1 = text1[count];
    const c2 = text2[count];
    if (c1 !== c2) break;
    count++;
  }

  return count;
}

function overlapRight(text1: string, text2: string) {
  let count = 0;

  while (count < text1.length && count < text2.length) {
    const c1 = text1[text1.length - 1 - count];
    const c2 = text2[text2.length - 1 - count];
    if (c1 !== c2) break;
    count++;
  }

  return count;
}

function minimalSolution(requirements: Array<[number, number]>): [number, number] {
  // Build all the pairs and order them by their sums.
  const pairs = requirements.flatMap(l => requirements.map<[number, number]>(r => [l[0], r[1]]));
  pairs.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));

  // Find the first pair that satisfies every requirement.
  for (const pair of pairs) {
    const [p0, p1] = pair;
    if (requirements.every(([r0, r1]) => r0 <= p0 || r1 <= p1)) {
      return pair;
    }
  }

  // Return the largest pairing (unreachable).
  return pairs[pairs.length - 1];
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE
}
