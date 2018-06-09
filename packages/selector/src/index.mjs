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

export function makeRefinable(selector, { createAnySelector }) {
  async function* refinableSelector({ descriptors, context }) {
    const matches = selector({ descriptors, context });
    for await (let match of matches) {
      const refiningDescriptor = match.descriptor.refinedBy;
      if (refiningDescriptor) {
        const anySelector = createAnySelector();
        const refiningMatches = anySelector({
          descriptors: [refiningDescriptor],
          context: matchAsContext(match),
        });
        for await (let refiningMatch of refiningMatches) {
          const refinedMatch = composeMatches(refiningMatch, match);
          yield refinedMatch;
        }
      } else {
        yield match;
      }
    }
  }

  return refinableSelector;
}

function matchAsContext(match) {
  return match[0];
}

function composeMatches(...matches) {
  return matches.reverse().reduce((match, refiningMatch) => {
    const refinedMatch = [...refiningMatch];
    refinedMatch.index = match.index + refiningMatch.index;
    refinedMatch.input = match.input;
    refinedMatch.descriptor = match.descriptor;
    return refinedMatch;
  });
}
