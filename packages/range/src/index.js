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

import { product } from './cartesian.js';

function textContent(scope) {
  return typeof scope === 'string'
    ? scope
    : scope instanceof Object && 'textContent' in scope
    ? scope.textContent
    : String(scope);
}

export function createRangeSelectorCreator(createSelector) {
  return function createRangeSelector(selector) {
    const startSelector = createSelector(selector.startSelector);
    const endSelector = createSelector(selector.endSelector);

    return async function* matchAll(scope) {
      const text = textContent(scope);

      const startMatches = startSelector(scope);
      const endMatches = endSelector(scope);

      const pairs = product(startMatches, endMatches);

      for await (let [start, end] of pairs) {
        if (start.index > end.index) continue;

        const result = [text.substring(start.index, end.index)];
        result.index = start.index;
        result.input = text;

        yield result;
      }
    };
  };
}
