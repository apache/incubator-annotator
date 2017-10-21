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

import { createSelector } from '@annotator/selector';
import { createTextQuoteSelector } from '@annotator/text';

export function createAnySelectorCreator(selectorTypeToFunction) {
  function createAnySelector() {
    async function* exec({ selectors, context }) {
      for (let selector of selectors) {
        let selectorFunc = selectorTypeToFunction[selector.type];
        if (selectorFunc === undefined) {
          throw new Error(`Unsupported selector type: ${selector.type}`);
        }
        yield* selectorFunc()({ selectors: [selector], context });
      }
    }

    return createSelector(exec);
  }

  return createAnySelector;
}

export const allSelectorTypes = {
  TextQuoteSelector: createTextQuoteSelector,
};

export const createAnySelector = createAnySelectorCreator(allSelectorTypes);
