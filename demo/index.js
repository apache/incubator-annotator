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

/* global corpus, module, parsed, selectable */

import {
  parse as parseFragment,
  stringify as stringifyFragment,
} from '@annotator/fragment-identifier';
import {
  createRangeSelectorCreator,
  createTextQuoteSelector,
  describeTextQuote,
} from '@annotator/dom';
import { makeRefinable } from '@annotator/selector';
import highlightRange from 'dom-highlight-range';

function clear() {
  corpus.innerHTML = selectable.innerHTML;
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
  clear();

  const identifier = window.location.hash.slice(1);
  if (!identifier) return;

  const { selector } = parseFragment(identifier);
  const matchAll = createSelector(selector);
  const ranges = [];

  for await (const range of matchAll(corpus)) {
    ranges.push(range);
  }

  for (const range of ranges) {
    highlightRange(range, 'highlighted');
  }

  parsed.innerText = JSON.stringify(selector, null, 2);
};

async function describeSelection() {
  const selection = document.getSelection();
  if (selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const scope = document.createRange();
  scope.selectNodeContents(selectable);

  if (!scope.isPointInRange(range.startContainer, range.startOffset)) return;
  if (!scope.isPointInRange(range.endContainer, range.endOffset)) return;

  return describeTextQuote(range, scope);
}

async function onSelectionChange() {
  const selector = await describeSelection();

  if (selector) {
    const fragment = stringifyFragment(selector);
    window.history.replaceState(selector, null, `#${fragment}`);
  } else {
    window.history.replaceState(null, null, location.pathname);
  }

  refresh();
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
