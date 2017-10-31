import { createSelector } from 'reselect';

export function makeRefinable(selector, { createAnySelector }) {
  const memoizedCreateAnySelector = createSelector(() => createAnySelector());

  async function* refinableSelector({ descriptors, context }) {
    const matches = selector({ descriptors, context });
    for await (let match of matches) {
      const refiningDescriptor = match.descriptor.refinedBy;
      if (refiningDescriptor) {
        const anySelector = memoizedCreateAnySelector();
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
