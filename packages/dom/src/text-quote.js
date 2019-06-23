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

// Range constants
const START_TO_START = 0;
const END_TO_END = 2;

function textContent(scope) {
  return scope instanceof Object && 'textContent' in scope
    ? scope.textContent
    : String(scope);
}

export function createTextQuoteSelector(selector) {
  return async function* matchAll(scope) {
    const text = textContent(scope);

    const prefix = selector.prefix || '';
    const suffix = selector.suffix || '';
    const pattern = prefix + selector.exact + suffix;

    let fromIndex = -1;

    while (true) {
      const matchIndex = text.indexOf(pattern, fromIndex + 1);
      if (matchIndex == -1) return;

      const result = [selector.exact];
      result.index = matchIndex + prefix.length;
      result.input = text;

      yield result;

      fromIndex = matchIndex;
    }
  };
}

export async function describeTextQuoteByRange({ range, context }) {
  if (context.compareBoundaryPoints(START_TO_START, range) > 0) {
    range.setStart(context.startContainer, context.startOffset);
  }

  if (context.compareBoundaryPoints(END_TO_END, range) < 0) {
    range.setEnd(context.endContainer, context.endOffset);
  }

  const contextText = context.toString();
  const exact = range.toString();

  const selector = {
    type: 'TextQuoteSelector',
    exact,
  };

  const root = context.commonAncestorContainer;
  const iter = createNodeIterator(root, SHOW_TEXT);

  const rangeIndex =
    range.startContainer.nodeType === TEXT_NODE
      ? seek(iter, range.startContainer) + range.startOffset
      : seek(iter, range.startContainer);

  const rangeEndIndex = rangeIndex + exact.length;

  const matches = createTextQuoteSelector(selector)(context);
  const minSuffixes = [];
  const minPrefixes = [];
  for await (let match of matches) {
    // For every match that is not our range, we look how many characters we
    // have to add as prefix or suffix to disambiguate.
    if (match.index !== rangeIndex) {
      const matchEndIndex = match.index + match[0].length;
      const suffixOverlap = overlap(
        contextText.substring(matchEndIndex),
        contextText.substring(rangeEndIndex),
      );
      minSuffixes.push(suffixOverlap + 1);
      const prefixOverlap = overlapRight(
        contextText.substring(0, match.index),
        contextText.substring(0, rangeIndex),
      );
      minPrefixes.push(prefixOverlap + 1);
    }
  }
  const [minSuffix, minPrefix] = minimalSolution(minSuffixes, minPrefixes);
  if (minSuffix > 0) {
    selector.suffix = contextText.substring(
      rangeEndIndex,
      rangeEndIndex + minSuffix,
    );
  }
  if (minPrefix > 0) {
    selector.prefix = contextText.substring(rangeIndex - minPrefix, rangeIndex);
  }
  return selector;
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
