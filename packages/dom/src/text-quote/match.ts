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
import { ownerDocument } from '../owner-document';
import { DomSeeker } from '../seek';

export function createTextQuoteSelectorMatcher(
  selector: TextQuoteSelector,
): Matcher<Range, Range> {
  return async function* matchAll(scope) {
    const document = ownerDocument(scope);
    const scopeText = scope.toString();

    const exact = selector.exact;
    const prefix = selector.prefix || '';
    const suffix = selector.suffix || '';
    const searchPattern = prefix + exact + suffix;

    let seeker: DomSeeker;
    try {
      seeker = new DomSeeker(scope);
    } catch (error) {
      // If the scope does not contain text nodes, we can stop. (if it contains
      // only empty text nodes we continue: it would still match an empty quote)
      if (error instanceof RangeError) return;
      else throw error;
    }

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
      seeker.seekTo(matchStartIndex);
      match.setStart(seeker.referenceNode, seeker.offsetInReferenceNode);

      // Seek to the end of the match, make the range end there.
      seeker.seekTo(matchEndIndex);
      match.setEnd(seeker.referenceNode, seeker.offsetInReferenceNode);

      // Yield the match.
      yield match;

      // Advance the search forward to detect multiple occurrences.
      fromIndex = matchStartIndex + 1;
    }
  };
}
