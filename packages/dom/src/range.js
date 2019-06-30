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

import { ownerDocument } from './scope.js';
import { product } from './cartesian.js';

export function createRangeSelectorCreator(createSelector) {
  return function createRangeSelector(selector) {
    const startSelector = createSelector(selector.startSelector);
    const endSelector = createSelector(selector.endSelector);

    return async function* matchAll(scope) {
      const document = ownerDocument(scope);

      const startMatches = startSelector(scope);
      const endMatches = endSelector(scope);

      const pairs = product(startMatches, endMatches);

      for await (let [start, end] of pairs) {
        const result = document.createRange();

        result.setStart(start.endContainer, start.endOffset);
        result.setEnd(end.startContainer, end.startOffset);

        if (!result.collapsed) yield result;
      }
    };
  };
}
