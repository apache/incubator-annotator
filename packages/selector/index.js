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

import { AsyncTee } from '@annotator/tee';
import {
  createSelectorCreator as _createSelectorCreator,
  defaultMemoize,
} from 'reselect';

export function createSelectorCreator(memoize, ...memoizeOptions) {
  const createSelector = _createSelectorCreator(memoize, ...memoizeOptions);
  return (...funcs) => {
    const resultFunc = funcs.pop();
    const wrapperFunc = (...args) => {
      const iterable = resultFunc(...args);
      return new AsyncTee(iterable);
    };
    funcs.push(wrapperFunc);
    return createSelector(...funcs);
  };
}

export const createSelector = createSelectorCreator(defaultMemoize);

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

const contextSelector = context => context;

export function createCssSelector(selectors) {
  const cssSelector = selectors.map(({ value }) => value).join(',');

  async function* exec(context) {
    yield* context.querySelectorAll(cssSelector);
  }

  return createDomSelector(contextSelector, exec);
}