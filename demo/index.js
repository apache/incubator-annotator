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

function clear() {
  corpus.innerHTML = selectable.innerHTML;
}

function highlight(range) {
  for (const node of textNodes(range)) {
    const mark = document.createElement('mark');
    const markRange = document.createRange();
    markRange.selectNode(node);
    markRange.surroundContents(mark);
  }
}

function textNodes(range) {
  const nodes = [];

  if (range.collapsed) return nodes;

  let startNode = range.startContainer;
  let startOffset = range.startOffset;

  if (startNode.nodeType === 3) {
    if (startOffset > 0 && startOffset < startNode.length) {
      startNode = startNode.splitText(startOffset);
      startOffset = 0;
    }
  }

  let endNode = range.endContainer;
  let endOffset = range.endOffset;

  if (endNode.nodeType === 3) {
    if (endOffset > 0 && endOffset < endNode.length) {
      endNode = endNode.splitText(endOffset);
      endOffset = 0;
    }
  }

  const walker = document.createTreeWalker(document.documentElement);
  walker.currentNode = startNode;

  while (walker.currentNode !== endNode) {
    if (walker.currentNode.nodeType === 3) {
      nodes.push(walker.currentNode);
    }
    walker.nextNode();
  }

  if (endNode.nodeType === 3 && endOffset > 0) {
    nodes.push(endNode);
  }

  return nodes;
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

  const fragment = window.location.hash.slice(1);
  if (!fragment) return;

  const { selector } = parseFragment(fragment);
  const matchAll = createSelector(selector);
  const ranges = [];

  for await (const range of matchAll(corpus)) {
    ranges.push(range);
  }

  for (const range of ranges) {
    highlight(range);
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
