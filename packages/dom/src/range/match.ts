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

import type {
  Matcher,
  RangeSelector,
  Selector,
} from '@apache-annotator/selector';
import { ownerDocument } from '../owner-document';
import { cartesian } from './cartesian';

/**
 * Find the range(s) corresponding to the given {@link
 * @apache-annotator/selector#RangeSelector}.
 *
 * As a RangeSelector itself nests two further selectors, one needs to pass a
 * `createMatcher` function that will be used to process those nested selectors.
 *
 * The function is curried, taking first the `createMatcher` function, then the
 * selector, and then the scope.
 *
 * As there may be multiple matches for a given selector, the matcher will
 * return an (async) generator that produces each match in the order they are
 * found in the text. If both its nested selectors produce multiple matches, the
 * RangeSelector matches each possible pair among those in which the order of
 * start and end are respected. *(Note this behaviour is a rather free
 * interpretation — the Web Annotation Data Model spec is silent about multiple
 * matches for RangeSelectors)*
 *
 * @example
 * By using a matcher for {@link @apache-annotator/selector#TextQuoteSelector}s, one
 * could create a matcher for text quotes with ellipsis to select a phrase
 * “ipsum … amet,”:
 * ```
 * const selector = {
 *   type: 'RangeSelector',
 *   startSelector: {
 *     type: 'TextQuoteSelector',
 *     exact: 'ipsum ',
 *   },
 *   endSelector: {
 *     type: 'TextQuoteSelector',
 *     // Because the end of a RangeSelector is *exclusive*, we’ll present the
 *     // latter part of the quote as the *prefix* so it will part of the match.
 *     exact: '',
 *     prefix: ' amet,',
 *   }
 * }}
 * const createRangeSelectorMatcher = makeCreateRangeSelectorMatcher(createTextQuoteMatcher);
 * const match = createRangeSelectorMatcher(selector)(document.body);
 * console.log(match)
 * // ⇒ Range { startContainer: #text, startOffset: 6, endContainer: #text,
 * //   endOffset: 27, … }
 * ```
 *
 * @example
 * To support RangeSelectors that might themselves contain RangeSelectors,
 * recursion can be created by supplying the resulting matcher creator function
 * as the `createMatcher` parameter:
 * ```
 * const createWhicheverMatcher = (selector) => {
 *   const innerCreateMatcher = {
 *     TextQuoteSelector: createTextQuoteSelectorMatcher,
 *     TextPositionSelector: createTextPositionSelectorMatcher,
 *     RangeSelector: makeCreateRangeSelectorMatcher(createWhicheverMatcher),
 *   }[selector.type];
 *   return innerCreateMatcher(selector);
 * });
 * ```
 *
 * @param createMatcher - The function used to process nested selectors.
 * @returns A function that, given a RangeSelector, creates a {@link
 * @apache-annotator/selector#Matcher} function that applies it to a given {@link https://developer.mozilla.org/en-US/docs/Web/API/Range
 * | Range}
 *
 * @public
 */
export function makeCreateRangeSelectorMatcher(
  createMatcher: <T extends Selector>(selector: T) => Matcher<Range, Range>,
): (selector: RangeSelector) => Matcher<Range, Range> {
  return function createRangeSelectorMatcher(selector) {
    const startMatcher = createMatcher(selector.startSelector);
    const endMatcher = createMatcher(selector.endSelector);

    return async function* matchAll(scope) {
      const startMatches = startMatcher(scope);
      const endMatches = endMatcher(scope);

      const pairs = cartesian(startMatches, endMatches);

      for await (const [start, end] of pairs) {
        const result = ownerDocument(scope).createRange();

        result.setStart(start.startContainer, start.startOffset);
        result.setEnd(end.startContainer, end.startOffset);

        if (!result.collapsed) yield result;
      }
    };
  };
}
