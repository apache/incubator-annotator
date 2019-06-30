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
  yield* createSelector(selector)(root);
}
