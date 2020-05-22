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

import { TextQuoteSelector } from '../../../selector/src';
import { DomScope, DomMatcher } from '../types';
import { ownerDocument, rangeFromScope } from '../scope';

export function createTextQuoteSelectorMatcher(selector: TextQuoteSelector): DomMatcher {
  return async function* matchAll(scope: DomScope) {
    const document = ownerDocument(scope);
    const range = rangeFromScope(scope);
    const root = range.commonAncestorContainer;
    const text = range.toString();

    const exact = selector.exact;
    const prefix = selector.prefix || '';
    const suffix = selector.suffix || '';
    const pattern = prefix + exact + suffix;

    const iter = document.createNodeIterator(
      root,
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

    let fromIndex = 0;
    let referenceNodeIndex = 0;

    if (isTextNode(range.startContainer)) {
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

      // Record the start container and offset.
      match.setStart(iter.referenceNode, matchStartIndex - referenceNodeIndex);

      // Seek to the end of the match.
      referenceNodeIndex += seek(iter, matchEndIndex - referenceNodeIndex);

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

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE
}
