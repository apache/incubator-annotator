/**
 * @license
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* global corpus, module, parsed, selectable */

import {
  parse as parseFragment,
  stringify as stringifyFragment,
} from '@annotator/fragment-identifier';
import {
  createRangeSelectorCreator,
  createTextQuoteSelector,
  describeTextQuote,
  highlightRange,
} from '@annotator/dom';
import { makeRefinable } from '@annotator/selector';

const cleanupFunctions = [];

function cleanup() {
  let removeHighlight;
  while ((removeHighlight = cleanupFunctions.shift())) {
    removeHighlight();
  }
  corpus.normalize();
}

const createSelector = makeRefinable(selector => {
  const selectorCreator = {
    TextQuoteSelector: createTextQuoteSelector,
    RangeSelector: createRangeSelectorCreator(createSelector),
  }[selector.type];

  if (selectorCreator == null) {
    throw new Error(`Unsupported selector type: ${selector.type}`);
  }

  return selectorCreator(selector);
});

const refresh = async () => {
  cleanup();

  const fragment = window.location.hash.slice(1);
  if (!fragment) return;

  const { selector } = parseFragment(fragment);
  const matchAll = createSelector(selector);
  const ranges = [];

  for await (const range of matchAll(corpus)) {
    ranges.push(range);
  }

  for (const range of ranges) {
    const removeHighlight = highlightRange(range);
    cleanupFunctions.push(removeHighlight);
  }

  parsed.innerText = JSON.stringify(selector, null, 2);
};

async function describeSelection() {
  const selection = document.getSelection();
  if (selection.type !== 'Range') return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  const scope = document.createRange();
  scope.selectNodeContents(selectable);

  if (!scope.isPointInRange(range.startContainer, range.startOffset)) return;
  if (!scope.isPointInRange(range.endContainer, range.endOffset)) return;

  return describeTextQuote(range, scope);
}

async function onSelectionChange() {
  const selector = await describeSelection();
  const fragment = selector ? stringifyFragment(selector) : '';
  const url = new URL(window.location.href);
  url.hash = fragment ? `#${fragment}` : '';

  if (url.href !== window.location.href) {
    window.history.replaceState(selector, null, url.href);
    refresh();
  }
}

window.addEventListener('popstate', refresh);
document.addEventListener('DOMContentLoaded', refresh);
document.addEventListener('selectionchange', onSelectionChange);

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    window.removeEventListener('popstate', refresh);
    document.removeEventListener('DOMContentLoaded', refresh);
    document.removeEventListener('selectionchange', onSelectionChange);
  });
}
