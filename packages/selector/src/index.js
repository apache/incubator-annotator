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

export function makeRefinable(selectorCreator) {
  return function createSelector(source) {
    const selector = selectorCreator(source);

    if (source.refinedBy) {
      const refiningSelector = createSelector(source.refinedBy);

      return async function* matchAll(scope) {
        for await (const match of selector(scope)) {
          const start = match.index;
          const end = start + match[0].length;

          for await (const refiningMatch of refiningSelector(scope)) {
            if (refiningMatch.index < start) continue;
            if (refiningMatch.index + refiningMatch[0].length > end) continue;
            yield refiningMatch;
          }
        }
      };
    }

    return selector;
  };
}
