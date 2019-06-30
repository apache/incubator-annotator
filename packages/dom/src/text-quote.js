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

function ownerDocument(scope) {
  if ('commonAncestorContainer' in scope) {
    return scope.commonAncestorContainer.ownerDocument;
  }

  return scope.ownerDocument;
}

function rangeFromScope(scope) {
  if ('commonAncestorContainer' in scope) {
    return scope;
  }

  const document = scope.ownerDocument;
  const range = document.createRange();

  range.selectNodeContents(scope);

  return range;
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

export async function describeTextQuoteByRange({ range, context }) {
  const root = context.commonAncestorContainer;
  const text = context.toString();

  const exact = range.toString();
  const selector = createTextQuoteSelector({ exact });

  const iter = createNodeIterator(root, SHOW_TEXT);

  const startNode = firstTextNodeInRange(range);
  const startIndex =
    range.startContainer.nodeType === TEXT_NODE
      ? seek(iter, startNode) + range.startOffset
      : seek(iter, startNode);
  const endIndex = startIndex + exact.length;

  const minSuffixes = [];
  const minPrefixes = [];

  for await (const match of selector(context)) {
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
    const prefixOverlap = overlapRight(
      text.substring(0, matchStartIndex),
      text.substring(0, startIndex),
    );

    // Determine how many suffix characters are shared.
    const suffixOverlap = overlap(
      text.substring(matchEndIndex),
      text.substring(endIndex),
    );

    // Record the prefix or suffix lengths that would not have matched.
    minPrefixes.push(prefixOverlap + 1);
    minSuffixes.push(suffixOverlap + 1);
  }

  // Construct and return an unambiguous selector.
  const result = { type: 'TextQuoteSelector', exact };

  if (minPrefixes.length > 0 || minSuffixes.length > 0) {
    const [minPrefix, minSuffix] = minimalSolution(minPrefixes, minSuffixes);

    if (minPrefix > 0) {
      result.prefix = text.substring(startIndex - minPrefix, startIndex);
    }

    if (minSuffix > 0) {
      result.suffix = text.substring(endIndex, endIndex + minSuffix);
    }
  }

  return result;
}

function overlap(text1, text2) {
  let count = 0;
  while (text1[count] === text2[count]) {
    count++;
    if (count >= text1.length) {
      return Infinity;
    }
  }
  return count;
}

function overlapRight(text1, text2) {
  let count = 0;
  while (text1[text1.length - 1 - count] === text2[text2.length - 1 - count]) {
    count++;
    if (count >= text1.length) {
      return Infinity;
    }
  }
  return count;
}

function minimalSolution(reqs1, reqs2) {
  if (reqs1.length !== reqs2.length) {
    throw new Error('unequal lengths');
  }
  // Add 0 as an option to try.
  reqs1.push(0);
  reqs2.push(0);
  let bestResult = [Infinity, Infinity];
  for (let i = 0; i < reqs1.length; i++) {
    const req1 = reqs1[i];
    // The values to satisfy for req2, given the proposed req1.
    const reqsToSatisfy = reqs1.map((v, i) => (v > req1 ? reqs2[i] : 0));
    // Take the lowest value that satisfies them all.
    const req2 = Math.max(...reqsToSatisfy);
    // If this combination is the best so far, remember it.
    if (req1 + req2 < bestResult[0] + bestResult[1]) {
      bestResult = [req1, req2];
    }
  }
  return bestResult;
}
