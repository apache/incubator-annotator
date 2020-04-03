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

/* global info, module, source, target */

import {
  createRangeSelectorCreator,
  createTextQuoteSelector,
  describeTextQuote,
  highlightRange,
} from '@annotator/dom';
import { makeRefinable } from '@annotator/selector';

const EXAMPLE_SELECTORS = [
  {
    type: 'TextQuoteSelector',
    exact: 'not',
  },
  {
    type: 'RangeSelector',
    startSelector: {
      type: 'TextQuoteSelector',
      exact: 'ann',
    },
    endSelector: {
      type: 'TextQuoteSelector',
      exact: '!',
    },
  },
  {
    type: 'TextQuoteSelector',
    exact: 'annotated world',
    refinedBy: {
      type: 'TextQuoteSelector',
      exact: 'tat',
    },
  },
  {
    type: 'TextQuoteSelector',
    exact: 'To annotate, or not to annotate,',
    refinedBy: {
      type: 'RangeSelector',
      startSelector: {
        type: 'TextQuoteSelector',
        exact: 'To annotate',
        refinedBy: {
          type: 'TextQuoteSelector',
          exact: 'annotate',
        },
      },
      endSelector: {
        type: 'TextQuoteSelector',
        exact: 'not to annotate',
        refinedBy: {
          type: 'TextQuoteSelector',
          exact: ' to',
        },
      },
      refinedBy: {
        type: 'TextQuoteSelector',
        exact: 'o',
      },
    },
  },
];

const cleanupFunctions = [];

function cleanup() {
  let removeHighlight;
  while ((removeHighlight = cleanupFunctions.shift())) {
    removeHighlight();
  }
  target.normalize();
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

const refresh = async selector => {
  cleanup();

  const matchAll = createSelector(selector);
  const ranges = [];

  for await (const range of matchAll(target)) {
    ranges.push(range);
  }

  for (const range of ranges) {
    const removeHighlight = highlightRange(range);
    cleanupFunctions.push(removeHighlight);
  }

  info.innerText = JSON.stringify(selector, null, 2);
};

async function describeSelection() {
  const selection = document.getSelection();
  if (selection.type !== 'Range') return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  const scope = document.createRange();
  scope.selectNodeContents(source);

  if (!scope.isPointInRange(range.startContainer, range.startOffset)) return;
  if (!scope.isPointInRange(range.endContainer, range.endOffset)) return;

  return describeTextQuote(range, scope);
}

async function onSelectionChange() {
  const selector = await describeSelection();
  refresh(selector);
}

function onSelectorExampleClick(event) {
  if (event.target.getAttribute('name') !== 'example') return;
  event.preventDefault();
  const exampleAnchors = document.querySelectorAll('[name=example]');
  const index = Array.from(exampleAnchors).indexOf(event.target);
  const selector = EXAMPLE_SELECTORS[index];
  refresh(selector);
}

window.addEventListener('popstate', () => refresh());
document.addEventListener('DOMContentLoaded', () => refresh());
document.addEventListener('selectionchange', onSelectionChange);
document.addEventListener('click', onSelectorExampleClick);

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    window.removeEventListener('popstate', refresh);
    document.removeEventListener('DOMContentLoaded', refresh);
    document.removeEventListener('selectionchange', onSelectionChange);
    document.removeEventListener('click', onSelectorExampleClick);
  });
}
