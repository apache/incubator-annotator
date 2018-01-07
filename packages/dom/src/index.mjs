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

export * from './text';
import { createSelectorCreator, defaultMemoize } from '@annotator/selector';

function domEqualityCheck(a, b) {
  if (a !== b) return false;
  // TODO:
  // - weakref the node
  // - attach mutation listener
  // - invalidate on mutations
  return true;
}

const createDomSelector = createSelectorCreator(
  defaultMemoize,
  domEqualityCheck
);

export function createCssSelector(selectors) {
  const cssSelector = selectors.map(({ value }) => value).join(',');

  async function* exec(context) {
    yield* context.querySelectorAll(cssSelector);
  }

  return createDomSelector(exec);
}
