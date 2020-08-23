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

import type { Matcher, TextQuoteSelector } from '@annotator/selector';
import seek from 'dom-seek';

export function createTextQuoteSelectorMatcher(
  selector: TextQuoteSelector,
): Matcher<Range, Range> {
  return async function* matchAll(scope) {
    const { commonAncestorContainer } = scope;
    const { ownerDocument } = commonAncestorContainer;
    const document = ownerDocument ?? (commonAncestorContainer as Document);

    const scopeText = scope.toString();

    const exact = selector.exact;
    const prefix = selector.prefix || '';
    const suffix = selector.suffix || '';
    const searchPattern = prefix + exact + suffix;

    const iter = document.createNodeIterator(
      commonAncestorContainer,
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

    let fromIndex = 0;
    while (fromIndex <= scopeText.length) {
      // Find the quote with its prefix and suffix in the string.
      const patternStartIndex = scopeText.indexOf(searchPattern, fromIndex);
      if (patternStartIndex === -1) return;

      // Correct for the prefix and suffix lengths.
      const matchStartIndex = patternStartIndex + prefix.length;
      const matchEndIndex = matchStartIndex + exact.length;

      // Create a range to represent this exact quote in the dom.
      const match = document.createRange();

      // Seek to the start of the match, make the range start there.
      referenceNodeIndex += seek(iter, matchStartIndex - referenceNodeIndex);
      match.setStart(iter.referenceNode, matchStartIndex - referenceNodeIndex);

      // Seek to the end of the match, make the range end there.
      referenceNodeIndex += seek(iter, matchEndIndex - referenceNodeIndex);
      match.setEnd(iter.referenceNode, matchEndIndex - referenceNodeIndex);

      // Yield the match.
      yield match;

      // Advance the search forward to detect multiple occurrences.
      fromIndex = matchStartIndex + 1;
    }
  };
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}
