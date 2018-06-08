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

import { createTextQuoteSelector } from '@annotator/text';
import { createRangeSelector } from '@annotator/range';
import { makeRefinable } from '@annotator/refinedBy';

export function createAnySelectorCreator(selectorCreatorsByType) {
  function selectSelector(type) {
    const selectorCreator = selectorCreatorsByType[type];
    if (selectorCreator === undefined) {
      throw new Error(`Unsupported selector type: ${type}`);
    }
    let selector = selectorCreator({ createAnySelector });
    selector = makeRefinable(selector, { createAnySelector });
    return selector;
  }

  function createAnySelector() {
    async function* anySelector({ descriptors, context }) {
      const descriptor = descriptors[0]; // TODO handle multiple descriptors
      const selectorFunc = selectSelector(descriptor.type);
      yield* selectorFunc({ descriptors: [descriptor], context });
    }
    return anySelector;
  }

  return createAnySelector;
}

export const allSelectorTypes = {
  TextQuoteSelector: createTextQuoteSelector,
  RangeSelector: createRangeSelector,
};

export const createAnySelector = createAnySelectorCreator(allSelectorTypes);
