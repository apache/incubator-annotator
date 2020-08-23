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

import type { TextQuoteSelector } from '../../src';
import { RangeInfo } from '../utils';

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
      exact: 'ipsum dolor',
    },
    expected: [
      {
        startContainerXPath: '//i/text()',
        startOffset: 0,
        endContainerXPath: '//b/text()[2]',
        endOffset: 0,
      },
    ],
  },
  'text inside <head>': {
    html:
      '<head><title>The title</title></head><b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      exact: 'title',
    },
    expected: [
      {
        startContainerXPath: '//title/text()',
        startOffset: 4,
        endContainerXPath: '//b/text()[1]',
        endOffset: 0,
      },
    ],
  },
  'two matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
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
  'overlapping matches': {
    html: '<b>bananas</b>',
    selector: {
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
  'no matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      exact: 'holy grail',
    },
    expected: [],
  },
  'with prefix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
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
      exact: 'dolor',
      prefix: 'oopsum ',
    },
    expected: [],
  },
  'with suffix, no matches': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      exact: 'dolor',
      suffix: ' amot',
    },
    expected: [],
  },
  'with suffix, no matches due to whitespace': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
      exact: 'dolor',
      suffix: 'a',
    },
    expected: [],
  },
  'with empty prefix and suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
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
  'empty quote, with prefix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    selector: {
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
      exact: '',
      prefix: 'X',
    },
    expected: [],
  },
};
