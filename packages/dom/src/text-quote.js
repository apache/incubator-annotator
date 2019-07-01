/**
 * @license
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import createNodeIterator from 'dom-node-iterator';
import seek from 'dom-seek';

import { ownerDocument, rangeFromScope } from './scope.js';

// Node constants
const TEXT_NODE = 3;

// NodeFilter constants
const SHOW_TEXT = 4;

function firstTextNodeInRange(range) {
  const { startContainer } = range;

  if (startContainer.nodeType === TEXT_NODE) return startContainer;

  const root = range.commonAncestorContainer;
  const iter = createNodeIterator(root, SHOW_TEXT);
  return iter.nextNode();
}

export function createTextQuoteSelector(selector) {
  return async function* matchAll(scope) {
    const document = ownerDocument(scope);
    const range = rangeFromScope(scope);
    const root = range.commonAncestorContainer;
    const text = range.toString();

    const exact = selector.exact;
    const prefix = selector.prefix || '';
    const suffix = selector.suffix || '';
    const pattern = prefix + exact + suffix;

    const iter = createNodeIterator(root, SHOW_TEXT);

    let fromIndex = 0;
    let referenceNodeIndex = 0;

    if (range.startContainer.nodeType === TEXT_NODE) {
      referenceNodeIndex -= range.startOffset;
    }

    while (fromIndex < text.length) {
      const patternStartIndex = text.indexOf(pattern, fromIndex);
      if (patternStartIndex === -1) return;

      const match = document.createRange();

      const matchStartIndex = patternStartIndex + prefix.length;
      const matchEndIndex = matchStartIndex + exact.length;

      // Seek to the start of the match.
      referenceNodeIndex += seek(iter, matchStartIndex - referenceNodeIndex);

      // Normalize the reference to the start of the match.
      if (!iter.pointerBeforeReferenceNode) {
        // Peek forward and skip over any empty nodes.
        if (iter.nextNode()) {
          while (iter.referenceNode.nodeValue.length === 0) {
            iter.nextNode();
          }

          // The iterator now points to the end of the reference node.
          // Move the iterator back to the start of the reference node.
          iter.previousNode();
        }
      }

      // Record the start container and offset.
      match.setStart(iter.referenceNode, matchStartIndex - referenceNodeIndex);

      // Seek to the end of the match.
      referenceNodeIndex += seek(iter, matchEndIndex - referenceNodeIndex);

      // Normalize the reference to the end of the match.
      if (!iter.pointerBeforeReferenceNode) {
        // Peek forward and skip over any empty nodes.
        if (iter.nextNode()) {
          while (iter.referenceNode.nodeValue.length === 0) {
            iter.nextNode();
          }

          // The iterator now points to the end of the reference node.
          // Move the iterator back to the start of the reference node.
          iter.previousNode();
        }

        // Maybe seek backwards to the start of the node.
        referenceNodeIndex += seek(iter, iter.referenceNode);
      }

      // Record the end container and offset.
      match.setEnd(iter.referenceNode, matchEndIndex - referenceNodeIndex);

      // Yield the match.
      yield match;

      // Advance the search forward.
      fromIndex = matchStartIndex + 1;
      referenceNodeIndex += seek(iter, fromIndex - referenceNodeIndex);
    }
  };
}

export async function describeTextQuote(range, scope = null) {
  scope = rangeFromScope(scope || ownerDocument(range).documentElement);

  const root = scope.commonAncestorContainer;
  const text = scope.toString();

  const exact = range.toString();
  const selector = createTextQuoteSelector({ exact });

  const iter = createNodeIterator(root, SHOW_TEXT);

  const startNode = firstTextNodeInRange(range);
  const startIndex =
    range.startContainer.nodeType === TEXT_NODE
      ? seek(iter, startNode) + range.startOffset
      : seek(iter, startNode);
  const endIndex = startIndex + exact.length;

  const affixLengthPairs = [[0, 0]];

  for await (const match of selector(scope)) {
    const matchIter = createNodeIterator(root, SHOW_TEXT);

    const matchStartNode = firstTextNodeInRange(match);
    const matchStartIndex =
      match.startContainer.nodeType === TEXT_NODE
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
  const result = { type: 'TextQuoteSelector', exact };

  if (affixLengthPairs.length) {
    const [prefixLength, suffixLength] = minimalSolution(affixLengthPairs);

    if (prefixLength > 0) {
      result.prefix = text.substring(startIndex - prefixLength, startIndex);
    }

    if (suffixLength > 0) {
      result.suffix = text.substring(endIndex, endIndex + suffixLength);
    }
  }

  return result;
}

function overlap(text1, text2) {
  let count = 0;

  while (count < text1.length && count < text2.length) {
    const c1 = text1[count];
    const c2 = text2[count];
    if (c1 !== c2) break;
    count++;
  }

  return count;
}

function overlapRight(text1, text2) {
  let count = 0;

  while (count < text1.length && count < text2.length) {
    const c1 = text1[text1.length - 1 - count];
    const c2 = text2[text2.length - 1 - count];
    if (c1 !== c2) break;
    count++;
  }

  return count;
}

function minimalSolution(requirements) {
  // Build all the pairs and order them by their sums.
  const pairs = requirements.flatMap(l => requirements.map(r => [l[0], r[1]]));
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
