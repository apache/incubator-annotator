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
        const matches = selector(scope);
        for await (let match of matches) {
          const refiningScope = matchAsScope(match);
          const refiningMatches = refiningSelector(refiningScope);
          for await (let refiningMatch of refiningMatches) {
            yield composeMatches(refiningMatch, match);
          }
        }
      };
    }

    return selector;
  };
}

function matchAsScope(match) {
  return match[0];
}

function composeMatches(...matches) {
  return matches.reverse().reduce((match, refiningMatch) => {
    const refinedMatch = [...refiningMatch];
    refinedMatch.index = match.index + refiningMatch.index;
    refinedMatch.input = match.input;
    return refinedMatch;
  });
}
