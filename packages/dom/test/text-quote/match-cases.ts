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
 *
 * SPDX-FileCopyrightText: The Apache Software Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TextQuoteSelector } from '@apache-annotator/selector';
import type { RangeInfo } from '../utils.js';

export const testCases: {
  [name: string]: {
    html: string;
    selector: TextQuoteSelector;
    expected: RangeInfo[];
  };
} = {
  simple: {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 12,
        endContainerXPath: '//b/text()',
        endOffset: 20,
      },
    ],
  },
  'first characters': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'lorem ipsum',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 0,
        endContainerXPath: '//b/text()',
        endOffset: 11,
      },
    ],
  },
  'last characters': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'yada yada',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 23,
        endContainerXPath: '//b/text()',
        endOffset: 32,
      },
    ],
  },
  'across elements': {
    html: '<b>lorem <i>ipsum</i> dolor <u>amet</u> yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
    },
    expected: [
      {
        startContainerXPath: '//b/text()[2]',
        startOffset: 1,
        endContainerXPath: '//u/text()',
        endOffset: 2,
      },
    ],
  },
  'exact element contents': {
    html: '<b>lorem <i>ipsum dolor</i> amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'ipsum dolor',
    },
    expected: [
      {
        startContainerXPath: '//i/text()',
        startOffset: 0,
        endContainerXPath: '//i/text()',
        endOffset: 11,
      },
    ],
  },
  'text inside <head>': {
    html:
      '<head><title>The title</title></head><b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'title',
    },
    expected: [
      {
        startContainerXPath: '//title/text()',
        startOffset: 4,
        endContainerXPath: '//title/text()',
        endOffset: 9,
      },
    ],
  },
  'two matches in one node': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'yada',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 23,
        endContainerXPath: '//b/text()',
        endOffset: 27,
      },
      {
        startContainerXPath: '//b/text()',
        startOffset: 28,
        endContainerXPath: '//b/text()',
        endOffset: 32,
      },
    ],
  },
  'matches in multiple nodes': {
    html: `<p>Match again and <b>again </b>and <i>again</i>!`,
    selector: {
      type: 'TextQuoteSelector',
      exact: 'again',
    },
    expected: [
      {
        startContainerXPath: '//p/text()[1]',
        startOffset: 6,
        endContainerXPath: '//p/text()[1]',
        endOffset: 11,
      },
      {
        startContainerXPath: '//b/text()',
        startOffset: 0,
        endContainerXPath: '//b/text()',
        endOffset: 5,
      },
      {
        startContainerXPath: '//i/text()',
        startOffset: 0,
        endContainerXPath: '//i/text()',
        endOffset: 5,
      },
    ],
  },
  'overlapping matches in one node': {
    html: '<b>bananas</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'ana',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 1,
        endContainerXPath: '//b/text()',
        endOffset: 4,
      },
      {
        startContainerXPath: '//b/text()',
        startOffset: 3,
        endContainerXPath: '//b/text()',
        endOffset: 6,
      },
    ],
  },
  'overlapping matches stretching multiple nodes': {
    html: '<b>bana<i>na</i>nas</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'anana',
    },
    expected: [
      {
        startContainerXPath: '//b/text()[1]',
        startOffset: 1,
        endContainerXPath: '//i/text()',
        endOffset: 2,
      },
      {
        startContainerXPath: '//b/text()[1]',
        startOffset: 3,
        endContainerXPath: '//b/text()[2]',
        endOffset: 2,
      },
    ],
  },
  'no matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'holy grail',
    },
    expected: [],
  },
  'with prefix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'yada',
      prefix: 't ',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 23,
        endContainerXPath: '//b/text()',
        endOffset: 27,
      },
    ],
  },
  'with suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'o',
      suffix: 'l',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 13,
        endContainerXPath: '//b/text()',
        endOffset: 14,
      },
    ],
  },
  'with prefix and suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'o',
      prefix: 'l',
      suffix: 're',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 1,
        endContainerXPath: '//b/text()',
        endOffset: 2,
      },
    ],
  },
  'with prefix and suffix, two matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'o',
      prefix: 'l',
      suffix: 'r',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 1,
        endContainerXPath: '//b/text()',
        endOffset: 2,
      },
      {
        startContainerXPath: '//b/text()',
        startOffset: 15,
        endContainerXPath: '//b/text()',
        endOffset: 16,
      },
    ],
  },
  'with prefix, no matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor',
      prefix: 'oopsum ',
    },
    expected: [],
  },
  'with suffix, no matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor',
      suffix: ' amot',
    },
    expected: [],
  },
  'with suffix, no matches due to whitespace': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor',
      suffix: 'a',
    },
    expected: [],
  },
  'with empty prefix and suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
      prefix: '',
      suffix: '',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 12,
        endContainerXPath: '//b/text()',
        endOffset: 20,
      },
    ],
  },
  'empty quote': {
    html: '<b>lorem</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
    },
    // A five character string contains six spots to find an empty string
    expected: Array(6)
      .fill(null)
      .map((_, i) => ({
        startContainerXPath: '//b/text()',
        startOffset: i,
        endContainerXPath: '//b/text()',
        endOffset: i,
      })),
  },
  'empty quote, multiple elements': {
    html: '<b>l<i>or</i>em</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
    },
    expected: [
      {
        startContainerXPath: '//b/text()[1]',
        startOffset: 0,
        endContainerXPath: '//b/text()[1]',
        endOffset: 0,
      },
      {
        startContainerXPath: '//b/text()[1]',
        startOffset: 1,
        endContainerXPath: '//b/text()[1]',
        endOffset: 1,
      },
      {
        startContainerXPath: '//i/text()',
        startOffset: 1,
        endContainerXPath: '//i/text()',
        endOffset: 1,
      },
      {
        startContainerXPath: '//i/text()',
        startOffset: 2,
        endContainerXPath: '//i/text()',
        endOffset: 2,
      },
      {
        startContainerXPath: '//b/text()[2]',
        startOffset: 1,
        endContainerXPath: '//b/text()[2]',
        endOffset: 1,
      },
      {
        startContainerXPath: '//b/text()[2]',
        startOffset: 2,
        endContainerXPath: '//b/text()[2]',
        endOffset: 2,
      },
    ],
  },
  'empty quote, with prefix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
      prefix: 'dolor',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 17,
        endContainerXPath: '//b/text()',
        endOffset: 17,
      },
    ],
  },
  'empty quote, with suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
      suffix: 'i',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 6,
        endContainerXPath: '//b/text()',
        endOffset: 6,
      },
    ],
  },
  'empty quote, with prefix and suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
      prefix: 'lorem ',
      suffix: 'ipsum',
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 6,
        endContainerXPath: '//b/text()',
        endOffset: 6,
      },
    ],
  },
  'empty quote, no matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextQuoteSelector',
      exact: '',
      prefix: 'X',
    },
    expected: [],
  },
};
