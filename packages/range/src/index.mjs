import { createSelector as createAnnotatorSelector } from '@annotator/selector';
import cartesian from './cartesian';

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
    const combinations = cartesian(startMatches, endMatches);
    for await (let [start, end] of combinations) {
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
