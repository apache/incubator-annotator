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

export function createRangeSelector(context, createAnySelector) {
  const startSelector = createAnySelector(context);
  const endSelector = createAnySelector(context);

  async function* rangeSelector(descriptors) {
    const descriptor = descriptors[0]; // TODO handle multiple descriptors
    const startMatches = startSelector([descriptor.startSelector]);
    const endMatches = endSelector([descriptor.endSelector]);
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

  return rangeSelector;
}

function rangeBetween({ start, end, context }) {
  const range = context.substring(start.index, end.index);
  return range;
}
