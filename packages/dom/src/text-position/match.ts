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
import type { Matcher, TextPositionSelector } from '@annotator/selector';
import { ownerDocument } from '../owner-document';

export function createTextPositionSelectorMatcher(
  selector: TextPositionSelector,
): Matcher<Range, Range> {
  return async function* matchAll(scope) {
    const document = ownerDocument(scope);
    const scopeText = scope.toString();

    const { start, end } = selector;

    const iter = document.createNodeIterator(
      scope.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node: Text) {
          // Only reveal nodes within the range; and skip any empty text nodes.
          return scope.intersectsNode(node) && node.length > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      },
    );

    // The index of the first character of iter.referenceNode inside the text.
    let referenceNodeIndex = isTextNode(scope.startContainer)
      ? -scope.startOffset
      : 0;

    // String indices are based on code points, not code units, so we actually have to count.
    const matchStartIndex = getIndexOfCharacterNumber(scopeText, start);
    const matchEndIndex = getIndexOfCharacterNumber(scopeText, end);

    // Create a range to represent the described text in the dom.
    const match = document.createRange();

    // Seek to the start of the match, make the range start there.
    referenceNodeIndex += seek(iter, matchStartIndex - referenceNodeIndex);
    match.setStart(iter.referenceNode, matchStartIndex - referenceNodeIndex);

    // Seek to the end of the match, make the range end there.
    referenceNodeIndex += seek(iter, matchEndIndex - referenceNodeIndex);
    match.setEnd(iter.referenceNode, matchEndIndex - referenceNodeIndex);

    // Yield the match.
    yield match;
  };
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function getIndexOfCharacterNumber(text: string, characterNumber: number): number {
  let index = 0;
  let characterCount = 0;
  for (let character of text) {
    if (characterCount >= characterNumber) // using >= to avoid infinite loop on invalid input.
      break;
    index += character.length; // note the length is either 1 or 2
    characterCount++;
  }
  if (characterCount === characterNumber)
    return index;
  throw new RangeError;
}
