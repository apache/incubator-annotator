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

export function createTextQuoteSelector() {
  async function* exec(selectors, context) {
    let patterns = selectors.map(({ exact }) => exact);
    for (let pattern of patterns) {
      let lastIndex = 0;
      let next = () => context.indexOf(pattern, lastIndex);
      let match = next();
      while (match !== -1) {
        let result = [pattern];
        result.index = match;
        result.input = context;
        result.selector = pattern;
        yield result;
        lastIndex = match + 1;
        match = next();
      }
    }
  }

  return createSelector(exec);
}
