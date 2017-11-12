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

/* global corpus, module */

import '@babel/polyfill';
import * as fragment from '@annotator/fragment-identifier';
import { describeTextQuoteByRange as describeRange } from '@annotator/dom';
// import { createAnySelector } from '@annotator/any';
import mark from './mark.js';
import search from './search.js';

const refresh = async () => {
  corpus.innerHTML = corpus.innerText;
  const identifier = window.location.hash.slice(1);
  if (!identifier) {
    debugInfo();
    return;
  }
  try {
    const { selector } = fragment.parse(identifier);
    debugInfo(selector);
    const results = search(corpus, selector);
    const ranges = [];
    for await (let range of results) {
      ranges.push(range);
    }
    for (let range of ranges) {
      try {
        mark(range);
      } catch (err) {
        console.log(`Failed to highlight text: ${range.cloneContents().textContent}`)
      }
    }
  } catch (e) {
    debugError(e);
    if (e instanceof fragment.SyntaxError) return;
    else throw e;
  }
};

const debugInfo = object => {
  const debugField = document.getElementById('debugField');
  debugField.classList.remove('error');
  debugField.innerText = JSON.stringify(object, null, 2);
};
const debugError = object => {
  const debugField = document.getElementById('debugField');
  debugField.classList.add('error');
  debugField.innerText = JSON.stringify(object, null, 2);
};

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('hashchange', refresh);
  refresh();
});

const editable = document.getElementById('corpus');
editable.addEventListener('input', function() {
  refresh();
});

const selectable = document.getElementById('selectableText');
document.addEventListener('selectionchange', onSelectionChange);

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

if (module.hot) {
  module.hot.accept(
    ['@annotator/fragment-identifier', './mark.js', './search.js'],
    refresh
  );
}

/*
 * EXAMPLE
 * async function run() {
 *   let textSelector = createAnySelector([
 *     { type: 'TextQuoteSelector', exact: 'yes' },
 *     { type: 'TextQuoteSelector', exact: 'no' },
 *   ]);
 *
 *   let context = 'what if yes yes what no yes no yes no hurray';
 *
 *   for await (let result of textSelector(context)) {
 *     console.log(result, result.context, result.index);
 *   }
 * }
 *
 * run();
 */
