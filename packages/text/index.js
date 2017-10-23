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

import normalizeRange from 'range-normalize';
import { createSelector } from '@annotator/selector';

export function createTextQuoteSelector() {
  async function* exec({ descriptors, context }) {
    for (let descriptor of descriptors) {
      const pattern = descriptor.exact;
      let lastIndex = 0;
      let next = () => context.indexOf(pattern, lastIndex);
      let match = next();
      while (match !== -1) {
        let result = [pattern];
        result.index = match;
        result.input = context;
        result.descriptor = descriptor;
        yield result;
        lastIndex = match + 1;
        match = next();
      }
    }
  }

  return createSelector(exec);
}

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
        contextText.substring(matchEndIndex, ),
        contextText.substring(rangeEndIndex, )
      );
      minSuffixes.push(suffixOverlap + 1);
      const prefixOverlap = overlapRight(
        contextText.substring(0, match.index),
        contextText.substring(0, rangeIndex)
      );
      minPrefixes.push(prefixOverlap + 1);
    }
  }
  let minSuffix = Math.max(0, ...minSuffixes);
  let minPrefix = Math.max(0, ...minPrefixes);
  if (minSuffix < minPrefix) {
    minPrefix = 0;
  } else {
    minSuffix = 0;
  }
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
  }
  return count;
}
function overlapRight(text1, text2) {
  let count = 0;
  while (text1[text1.length - 1 - count] === text2[text2.length - 1 - count]) {
    count++;
  }
  return count;
}

export function describeTextQuote({ context, startIndex, endIndex }) {
  const exact = context.substring(startIndex, endIndex);
  return {
    type: 'TextQuoteSelector',
    exact,
  };
}
