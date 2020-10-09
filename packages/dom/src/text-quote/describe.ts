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

import type { TextQuoteSelector } from '@annotator/selector';
import { ownerDocument } from '../owner-document';
import { Seeker } from '../seek';

export async function describeTextQuote(
  range: Range,
  scope?: Range,
): Promise<TextQuoteSelector> {
  // Default to search in the whole document.
  if (scope === undefined) {
    const document = ownerDocument(range);
    scope = document.createRange();
    scope.selectNodeContents(document);
  }
  range = range.cloneRange();

  // Take the part of the range that falls within the scope.
  if (range.compareBoundaryPoints(Range.START_TO_START, scope) === -1)
    range.setStart(scope.startContainer, scope.startOffset);
  if (range.compareBoundaryPoints(Range.END_TO_END, scope) === 1)
    range.setEnd(scope.endContainer, scope.endOffset);

  return {
    type: 'TextQuoteSelector',
    exact: range.toString(),
    ...calculateContextForDisambiguation(range, scope),
  };
}

function calculateContextForDisambiguation(
  range: Range,
  scope: Range,
): { prefix: string; suffix: string } {
  const exactText = range.toString();
  const scopeText = scope.toString();
  const targetStartIndex = getRangeTextPosition(range, scope);
  const targetEndIndex = targetStartIndex + exactText.length;

  // Starting with an empty prefix and suffix, we search for matches. At each unintended match
  // we encounter, we extend the prefix or suffix just enough to ensure it will no longer match.
  let prefix = '';
  let suffix = '';
  let fromIndex = 0;
  while (fromIndex <= scopeText.length) {
    const searchPattern = prefix + exactText + suffix;
    const patternMatchIndex = scopeText.indexOf(searchPattern, fromIndex);
    if (patternMatchIndex === -1) break;
    fromIndex = patternMatchIndex + 1;

    const matchStartIndex = patternMatchIndex + prefix.length;
    const matchEndIndex = matchStartIndex + exactText.length;

    // Skip the found match if it is the actual target.
    if (matchStartIndex === targetStartIndex) continue;

    // Count how many characters we’d need as a prefix to disqualify this match.
    let sufficientPrefixLength = prefix.length + 1;
    const firstChar = (offset: number) =>
      scopeText[offset - sufficientPrefixLength];
    while (
      firstChar(targetStartIndex) &&
      firstChar(targetStartIndex) === firstChar(matchStartIndex)
    )
      sufficientPrefixLength++;
    if (!firstChar(targetStartIndex))
      // We reached the start of scopeText; prefix won’t work.
      sufficientPrefixLength = Infinity;

    // Count how many characters we’d need as a suffix to disqualify this match.
    let sufficientSuffixLength = suffix.length + 1;
    const lastChar = (offset: number) =>
      scopeText[offset + sufficientSuffixLength - 1];
    while (
      lastChar(targetEndIndex) &&
      lastChar(targetEndIndex) === lastChar(matchEndIndex)
    )
      sufficientSuffixLength++;
    if (!lastChar(targetEndIndex))
      // We reached the end of scopeText; suffix won’t work.
      sufficientSuffixLength = Infinity;

    // Use either the prefix or suffix, whichever is shortest.
    if (sufficientPrefixLength <= sufficientSuffixLength) {
      // Compensate our search position for the increase in prefix length.
      fromIndex -= sufficientPrefixLength - prefix.length;
      prefix = scopeText.substring(
        targetStartIndex - sufficientPrefixLength,
        targetStartIndex,
      );
    } else {
      suffix = scopeText.substring(
        targetEndIndex,
        targetEndIndex + sufficientSuffixLength,
      );
    }
  }

  return { prefix, suffix };
}

// Get the index of the first character of range within the text of scope.
function getRangeTextPosition(range: Range, scope: Range): number {
  const seeker = new Seeker(scope);
  const scopeOffset = isTextNode(scope.startContainer) ? scope.startOffset : 0;
  if (isTextNode(range.startContainer))
    return seeker.seek(range.startContainer) + range.startOffset - scopeOffset;
  else return seeker.seek(firstTextNodeInRange(range)) - scopeOffset;
}

function firstTextNodeInRange(range: Range): Text {
  // Find the first text node inside the range.
  const iter = ownerDocument(range).createNodeIterator(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Text) {
        // Only reveal nodes within the range; and skip any empty text nodes.
        return range.intersectsNode(node) && node.length > 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    },
  );
  const node = iter.nextNode() as Text | null;
  if (node === null) throw new Error('Range contains no text nodes');
  return node;
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}
