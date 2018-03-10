import { createSelector as createAnnotatorSelector } from '@annotator/selector';
import { product } from './cartesian';

export function createRangeSelector({ createAnySelector }) {
  const startSelector = createAnySelector();
  const endSelector = createAnySelector();

  async function* rangeSelector({ descriptors, context }) {
    const descriptor = descriptors[0]; // TODO handle multiple descriptors
    const startMatches = startSelector({
      descriptors: [descriptor.startSelector],
      context,
    });
    const endMatches = endSelector({
      descriptors: [descriptor.endSelector],
      context,
    });
    const pairs = product(startMatches, endMatches);
    for await (let [start, end] of pairs) {
      if (start.index > end.index) {
        continue;
      }
      const text = rangeBetween({ start, end, context });
      const result = [text];
      result.index = start.index;
      result.input = context;
      result.descriptor = descriptor;
      yield result;
    }
  }

  return createAnnotatorSelector(rangeSelector);
}

function rangeBetween({ start, end, context }) {
  const range = context.substring(start.index, end.index);
  return range;
}
