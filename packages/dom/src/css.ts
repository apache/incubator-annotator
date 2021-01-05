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

import type { CssSelector, Matcher } from '@apache-annotator/selector';
import { ownerDocument } from './owner-document';

/**
 * Find the elements corresponding to the given {@link
 * @apache-annotator/selector#CssSelector}.
 *
 * @remarks
 * The given CssSelector returns all elements within `scope` that it matches.
 * However, the selector is evaluated relative to the Document as a whole.
 * *(XXX is this intentional, a mistake, or compromise?)*
 *
 * The function is curried, taking first the selector and then the scope.
 *
 * As there may be multiple matches for a given selector, the matcher will
 * return an (async) generator that produces each match in the order they are
 * found in the text.
 *
 * Each matching element is returned as a {@link https://developer.mozilla.org/en-US/docs/Web/API/Range
 * | Range} surrounding that element. This in order to make its output reusable
 * as the scope for any subsequents selectors that {@link
 * @apache-annotator/selector#Selector.refinedBy | refine} this CssSelector.
 *
 * @param selector - The {@link @apache-annotator/selector#CssSelector} to be
 * anchored
 * @returns A {@link @apache-annotator/selector#Matcher} function that applies
 * `selector` to a given {@link https://developer.mozilla.org/en-US/docs/Web/API/Range
 * | Range}
 *
 * @public
 */
export function createCssSelectorMatcher(
  selector: CssSelector,
): Matcher<Range, Range> {
  return async function* matchAll(scope) {
    const document = ownerDocument(scope);
    for (const element of document.querySelectorAll(selector.value)) {
      const range = document.createRange();
      range.selectNode(element);

      if (
        scope.isPointInRange(range.startContainer, range.startOffset) &&
        scope.isPointInRange(range.endContainer, range.endOffset)
      ) {
        yield range;
      }
    }
  };
}
