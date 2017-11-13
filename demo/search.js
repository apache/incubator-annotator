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

import { createAnySelector } from '@annotator/any';

/**
 * Locate a selector.
 * @param {Node} root node
 * @param {Selector} descriptor
 * @return {Range}
 */
export default search;

const selectorFunc = createAnySelector();

async function* search(root, descriptor) {
  for (const node of nodeIterator(root)) {
    if (!node.nodeValue) continue;

    const matches = selectorFunc({
      descriptors: [descriptor],
      context: node.nodeValue,
    });
    for await (let match of matches) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;
      const range = document.createRange();
      range.setStart(node, startIndex);
      range.setEnd(node, endIndex);
      yield range;
    }
  }
}

/**
 * Iterate over the nodes of a sub-tree of the document.
 * @param {Node} node
 */
function* nodeIterator(node) {
  yield node;

  for (const child of node.childNodes) {
    yield* nodeIterator(child);
  }
}
