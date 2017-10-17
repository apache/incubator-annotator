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

/* global corpus, query, module */

import * as fragment from '@annotator/fragment-identifier';
import mark from './mark.js';
import search from './search.js';

const input = () => {
  const type = 'TextQuoteSelector';
  const exact = query.value;
  if (exact) {
    window.location.hash = fragment.stringify({ type, exact });
  } else {
    window.history.replaceState(null, '', window.location.pathname);
    refresh();
  }
};

const refresh = () => {
  corpus.innerHTML = corpus.innerText;
  const identifier = window.location.hash.slice(1);
  if (!identifier) return;
  try {
    const { selector } = fragment.parse(identifier);
    const range = search(corpus, selector);
    if (range) mark(range);
  } catch (e) {
    if (e instanceof fragment.SyntaxError) return;
    else throw e;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  query.addEventListener('input', input);
  window.addEventListener('hashchange', refresh);
  refresh();
});

const editable = document.getElementById('corpus');
editable.addEventListener('input', function() {
  refresh();
});

if (module.hot) {
  module.hot.accept(
    ['@annotator/fragment-identifier', './mark.js', './search.js'],
    refresh
  );
}
