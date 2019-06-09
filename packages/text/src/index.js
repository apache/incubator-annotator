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

export function createTextQuoteSelector(selector) {
  return async function* matchAll(scope) {
    const prefix = selector.prefix || '';
    const suffix = selector.suffix || '';
    const pattern = prefix + selector.exact + suffix;
    let lastIndex = 0;
    let next = () => scope.indexOf(pattern, lastIndex);
    let match = next();
    while (match !== -1) {
      let result = [selector.exact];
      result.index = match + prefix.length;
      result.input = scope;
      result.selector = selector;
      yield result;
      lastIndex = match + 1;
      match = next();
    }
  };
}

export function describeTextQuote({ scope, startIndex, endIndex }) {
  const exact = scope.substring(startIndex, endIndex);
  return {
    type: 'TextQuoteSelector',
    exact,
  };
}
