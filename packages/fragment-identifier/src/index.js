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

export { SyntaxError, parse } from './fragment';

/**
 * Convert a Selector or State into a fragment identifier string.
 * @param {(Selector|State)} resource
 * @return {string}
 */
export function stringify(resource) {
  const data = Object.keys(resource)
    .map(key => {
      let value = resource[key];
      if (value instanceof Object) value = value.valueOf();
      if (value instanceof Object) {
        value = stringify(value);
        return `${encodeURIComponent(key)}=${value}`;
      }
      return [key, value].map(encodeURIComponent).join('=');
    })
    .join(',');

  if (/Selector$/.test(resource.type)) return `selector(${data})`;
  if (/State$/.test(resource.type)) return `state(${data})`;
  throw new TypeError('Resource must be a Selector or State');
}
