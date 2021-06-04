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

import optimalSelect from 'optimal-select';
import type { CssSelector, Matcher } from '@apache-annotator/selector';
import { ownerDocument } from './owner-document';

/**
 * Find the elements corresponding to the given {@link
 * CssSelector}.
 *
 * The given CssSelector returns all elements within `scope` that it matches.
 * However, the selector is evaluated relative to the Document as a whole.
 * *(XXX is this intentional, a mistake, or compromise?)*
 *
 * The function is curried, taking first the selector and then the scope.
 *
 * As there may be multiple matches for a given selector, the matcher will
 * return an (async) iterable that produces each match in the order they are
 * found in the document.
 *
 * Note that the Web Annotation specification does not mention whether an
 * ‘ambiguous’ CssSelector should indeed match all elements that match the
 * selector value, or perhaps only the first. This implementation returns all
 * matches to give users the freedom to follow either interpretation. This is
 * also in line with more clearly defined behaviour of the TextQuoteSelector:
 *
 * > “If […] the user agent discovers multiple matching text sequences, then the
 * > selection SHOULD be treated as matching all of the matches.”
 *
 * @param selector - The {@link CssSelector} to be anchored
 * @returns A {@link Matcher} function that applies `selector` to a given {@link https://developer.mozilla.org/en-US/docs/Web/API/Range
 * | Range}
 *
 * @public
 */
export function createCssSelectorMatcher(
  selector: CssSelector,
): Matcher<Range, Element> {
  return async function* matchAll(scope) {
    const document = ownerDocument(scope);
    for (const element of document.querySelectorAll(selector.value)) {
      const range = document.createRange();
      range.selectNode(element);

      if (
        scope.isPointInRange(range.startContainer, range.startOffset) &&
        scope.isPointInRange(range.endContainer, range.endOffset)
      ) {
        yield element;
      }
    }
  };
}

/**
 * Returns a {@link CssSelector} that unambiguously describes the given
 * element, within the given scope.
 *
 * @example
 * ```
 * const target = document.getElementById('targetelement').firstElementChild;
 * const selector = await describeCss(target);
 * console.log(selector);
 * // {
 * //   type: 'CssSelector',
 * //   value: '#targetelement > :nth-child(1)'
 * // }
 * ```
 *
 * @param element - The element that the selector should describe.
 * @param scope - The node that serves as the ‘document’ for purposes of finding
 * a unique selector. Defaults to span the full Document that contains the
 * `element`.
 * @returns The selector unambiguously describing `element` within `scope`.
 */
export async function describeCss(
  element: HTMLElement,
  scope: Node = element.ownerDocument,
): Promise<CssSelector> {
  const selector = optimalSelect(element, { root: scope });
  return {
    type: 'CssSelector',
    value: selector,
  };
}
