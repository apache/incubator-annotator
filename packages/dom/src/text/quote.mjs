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

/* global Range */

import normalizeRange from 'range-normalize';
import { createTextQuoteSelector } from '@annotator/text';

export async function describeTextQuoteByRange({ range, context }) {
  // Shrink range to fit in context, if needed.
  if (range.compareBoundaryPoints(Range.END_TO_END, context) > 0) {
    range.setEnd(context.endContainer, context.endOffset);
  }
  if (range.compareBoundaryPoints(Range.START_TO_START, context) < 0) {
    range.setStart(context.startContainer, context.startOffset);
  }

  const contextText = context.cloneContents().textContent;
  const exact = range.cloneContents().textContent;

  const descriptor = {
    type: 'TextQuoteSelector',
    exact,
  };

  // FIXME We should get range index relative to context. Look at
  // dom-anchor-text-position? For now, we implement the easy case where the
  // ranges are within the same container.
  context = normalizeRange(context);
  range = normalizeRange(range);
  if (
    context.startContainer !== range.startContainer ||
    context.startOffset !== 0
  ) {
    throw new Error(`Context not equal to range's container; not implemented.`);
  }
  const rangeIndex = range.startOffset;
  const rangeEndIndex = range.endOffset;

  const selector = createTextQuoteSelector();
  const matches = selector({ descriptors: [descriptor], context: contextText });
  const minSuffixes = [];
  const minPrefixes = [];
  for await (let match of matches) {
    // For every match that is not our range, we look how many characters we
    // have to add as prefix or suffix to disambiguate.
    if (match.index !== rangeIndex) {
      const matchEndIndex = match.index + match[0].length;
      const suffixOverlap = overlap(
        contextText.substring(matchEndIndex),
        contextText.substring(rangeEndIndex)
      );
      minSuffixes.push(suffixOverlap + 1);
      const prefixOverlap = overlapRight(
        contextText.substring(0, match.index),
        contextText.substring(0, rangeIndex)
      );
      minPrefixes.push(prefixOverlap + 1);
    }
  }
  const [minSuffix, minPrefix] = minimalSolution(minSuffixes, minPrefixes);
  if (minSuffix > 0) {
    descriptor.suffix = contextText.substring(
      rangeEndIndex,
      rangeEndIndex + minSuffix
    );
  }
  if (minPrefix > 0) {
    descriptor.prefix = contextText.substring(
      rangeIndex - minPrefix,
      rangeIndex
    );
  }
  return descriptor;
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
