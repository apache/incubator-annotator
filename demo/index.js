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

/* global corpus, debug, module, selectable */

import '@babel/polyfill';
import * as fragment from '@annotator/fragment-identifier';
import { describeTextQuoteByRange as describeRange } from '@annotator/dom';
// import { createAnySelector } from '@annotator/any';
import { mark } from './mark.js';
import { search } from './search.js';

const refresh = async () => {
  corpus.innerHTML = corpus.innerText;
  debug.classList.remove('error');

  const identifier = window.location.hash.slice(1);
  if (!identifier) return;

  try {
    const { selector } = fragment.parse(identifier);
    debug.innerText = JSON.stringify(selector, null, 2);
    const results = search(corpus, selector);
    const ranges = [];
    for await (let range of results) {
      ranges.push(range);
    }
    for (let range of ranges) {
      mark(range);
    }
  } catch (e) {
    debug.classList.add('error');
    debug.innerText = JSON.stringify(e, null, 2);
    if (e instanceof fragment.SyntaxError) return;
    else throw e;
  }
};

async function onSelectionChange() {
  const selection = document.getSelection();
  if (selection === null || selection.isCollapsed) {
    return;
  }
  const range = selection.getRangeAt(0);
  if (!isWithinNode(range, selectable)) {
    return;
  }
  const selectableRange = document.createRange();
  selectableRange.selectNodeContents(selectable);
  const descriptor = await describeRange({ range, context: selectableRange });
  window.location.hash = fragment.stringify(descriptor);
}

function isWithinNode(range, node) {
  const nodeRange = document.createRange();
  nodeRange.selectNode(node);
  return (
    range.compareBoundaryPoints(Range.START_TO_START, nodeRange) >= 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, nodeRange) <= 0
  );
}

window.addEventListener('hashchange', refresh);
document.addEventListener('DOMContentLoaded', refresh);
document.addEventListener('selectionchange', onSelectionChange);

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    window.removeEventListener('hashchange', refresh);
    document.removeEventListener('DOMContentLoaded', refresh);
    document.removeEventListener('selectionchange', onSelectionChange);
  });
}
