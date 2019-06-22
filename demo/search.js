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

import { makeRefinable } from '@annotator/selector';
import { createRangeSelectorCreator } from '@annotator/range';
import { createTextQuoteSelector } from '@annotator/dom';
import createNodeIterator from 'dom-node-iterator';
import seek from 'dom-seek';

const createSelector = makeRefinable(selector => {
  const selectorCreator = {
    TextQuoteSelector: createTextQuoteSelector,
    RangeSelector: createRangeSelectorCreator(createSelector),
  }[selector.type];

  if (selectorCreator == null) {
    throw new Error(`Unsupported selector type: ${selector.type}`);
  }

  return selectorCreator(selector);
});

/**
 * Locate a selector.
 * @param {Node} root node
 * @param {Selector} selector
 * @return {Range}
 */
export async function* search(root, selector) {
  const matches = createSelector(selector)(root);

  for await (let match of matches) {
    const matchIndex = match.index;
    const matchLength = match[0].length;

    const iter = createNodeIterator(root, NodeFilter.SHOW_TEXT);

    const startIndex = seek(iter, matchIndex);
    const startContainer = iter.referenceNode;
    const startOffset = match.index - startIndex;

    const endIndex = startIndex + seek(iter, startOffset + matchLength);
    const endContainer = iter.referenceNode;
    const endOffset = matchIndex + matchLength - endIndex;

    const range = document.createRange();
    range.setStart(startContainer, startOffset);
    range.setEnd(endContainer, endOffset);

    yield range;
  }
}
