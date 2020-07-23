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

import seek from 'dom-seek';
import { TextQuoteSelector } from '@annotator/selector';

import { DomScope } from '../types';
import { ownerDocument, rangeFromScope } from '../scope';

export async function describeTextQuote(
  range: Range,
  scope: DomScope = ownerDocument(range).documentElement,
): Promise<TextQuoteSelector> {
  range = range.cloneRange();

  // Take the part of the range that falls within the scope.
  const scopeAsRange = rangeFromScope(scope);
  if (!scopeAsRange.isPointInRange(range.startContainer, range.startOffset))
    range.setStart(scopeAsRange.startContainer, scopeAsRange.startOffset);
  if (!scopeAsRange.isPointInRange(range.endContainer, range.endOffset))
    range.setEnd(scopeAsRange.endContainer, scopeAsRange.endOffset);

  const exact = range.toString();

  const result: TextQuoteSelector = { type: 'TextQuoteSelector', exact };

  const { prefix, suffix } = calculateContextForDisambiguation(range, result, scope);
  result.prefix = prefix;
  result.suffix = suffix;

  return result
}

function calculateContextForDisambiguation(
  range: Range,
  selector: TextQuoteSelector,
  scope: DomScope,
): { prefix?: string, suffix?: string } {
  const exactText = selector.exact;
  const scopeText = rangeFromScope(scope).toString();
  const targetStartIndex = getRangeTextPosition(range, scope);
  const targetEndIndex = targetStartIndex + exactText.length;

  // Find all matches of the text in the scope.
  const stringMatches: number[] = [];
  let fromIndex = 0;
  while (fromIndex <= scopeText.length) {
    const matchIndex = scopeText.indexOf(exactText, fromIndex);
    if (matchIndex === -1) break;
    stringMatches.push(matchIndex);
    fromIndex = matchIndex + 1;
  }

  // Count for each undesired match the required prefix and suffix lengths, such that either of them
  // would have invalidated the match.
  const affixLengthPairs: Array<[number, number]> = [];
  for (const matchStartIndex of stringMatches) {
    const matchEndIndex = matchStartIndex + exactText.length

    // Skip the found match if it is the actual target.
    if (matchStartIndex === targetStartIndex)
      continue;

    // Count how many characters before & after them the false match and target have in common.
    const sufficientPrefixLength = charactersNeededToBeUnique(
      scopeText.substring(0, targetStartIndex),
      scopeText.substring(0, matchStartIndex),
      true,
    );
    const sufficientSuffixLength = charactersNeededToBeUnique(
      scopeText.substring(targetEndIndex),
      scopeText.substring(matchEndIndex),
      false,
    );
    affixLengthPairs.push([sufficientPrefixLength, sufficientSuffixLength]);
  }

  // Find the prefix and suffix that would invalidate all mismatches, using the minimal characters
  // for prefix and suffix combined.
  const [prefixLength, suffixLength] = minimalSolution(affixLengthPairs);
  const prefix = scopeText.substring(targetStartIndex - prefixLength, targetStartIndex);
  const suffix = scopeText.substring(targetEndIndex, targetEndIndex + suffixLength);
  return { prefix, suffix };
}

function charactersNeededToBeUnique(target: string, impostor: string, reverse: boolean = false) {
  // Count how many characters the two strings have in common.
  let overlap = 0;
  const charAt = (s: string, i: number) => reverse ? s[s.length - 1 - i] : s[overlap];
  while (overlap < target.length && charAt(target, overlap) === charAt(impostor, overlap))
    overlap++;
  if (overlap === target.length)
    return Infinity; // (no substring of target can make it distinguishable from its impostor)
  else
    return overlap + 1;
}

function minimalSolution(requirements: Array<[number, number]>): [number, number] {
  // Ensure we try solutions with an empty prefix or suffix.
  requirements.push([0, 0]);

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

// Get the index of the first character of range within the text of scope.
function getRangeTextPosition(range: Range, scope: DomScope): number {
  const scopeAsRange = rangeFromScope(scope);
  const iter = document.createNodeIterator(
    scopeAsRange.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Text) {
        // Only reveal nodes within the range
        return scopeAsRange.intersectsNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      },
    },
  );
  const scopeOffset = isTextNode(scopeAsRange.startContainer) ? scopeAsRange.startOffset : 0;
  if (isTextNode(range.startContainer))
    return seek(iter, range.startContainer) + range.startOffset - scopeOffset;
  else
    return seek(iter, firstTextNodeInRange(range)) - scopeOffset;
}

function firstTextNodeInRange(range: Range): Text {
  // Find the first text node inside the range.
  const iter = document.createNodeIterator(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Text) {
        // Only reveal nodes within the range; and skip any empty text nodes.
        return range.intersectsNode(node) && node.length > 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
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
