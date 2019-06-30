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

import {
  parse as parseFragment,
  stringify as stringifyFragment,
  SyntaxError as FragmentSyntaxError,
} from '@annotator/fragment-identifier';
import { describeTextQuoteByRange as describeRange } from '@annotator/dom';

import { mark } from './mark.js';
import { search } from './search.js';

function clear() {
  corpus.innerHTML = selectable.innerHTML;
}

const refresh = async () => {
  clear();

  const identifier = window.location.hash.slice(1);
  if (!identifier) return;

  try {
    const { selector } = parseFragment(identifier);
    for await (const range of search(corpus, selector)) mark(range);
    debug.classList.remove('error');
    debug.innerText = JSON.stringify(selector, null, 2);
  } catch (e) {
    debug.classList.add('error');
    debug.innerText = JSON.stringify(e, null, 2);
    if (e instanceof FragmentSyntaxError) return;
    else throw e;
  }
};

async function describeSelection() {
  const selection = document.getSelection();
  if (selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  const context = document.createRange();
  context.selectNodeContents(selectable);

  if (!context.isPointInRange(range.startContainer, range.startOffset)) return;
  if (!context.isPointInRange(range.endContainer, range.endOffset)) return;

  return describeRange({ range, context });
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
