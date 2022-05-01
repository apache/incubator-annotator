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

import type {
  TextQuoteSelector,
  DescribeTextQuoteOptions,
} from '@apache-annotator/selector';
import type { RangeInfo } from '../utils.js';

export interface DescribeTextQuoteTestCases {
  [name: string]: {
    html: string;
    range: RangeInfo;
    options: DescribeTextQuoteOptions;
    expected: TextQuoteSelector;
  };
}

export const testCasesWithoutOptions: DescribeTextQuoteTestCases = {
  'no context': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 12,
      endContainerXPath: '//b/text()',
      endOffset: 22,
    },
    options: {},
    expected: {
      type: 'TextQuoteSelector',
      exact: 'dolor amet',
      prefix: '',
      suffix: '',
    },
  },
  'use prefix to complete word': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 14,
      endContainerXPath: '//b/text()',
      endOffset: 22,
    },
    options: {},
    expected: {
      type: 'TextQuoteSelector',
      exact: 'lor amet',
      prefix: 'do',
      suffix: '',
    },
  },
  'use suffix to complete word': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 12,
      endContainerXPath: '//b/text()',
      endOffset: 20,
    },
    options: {},
    expected: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
      prefix: '',
      suffix: 'et',
    },
  },
  'add context to disambiguate': {
    html: '<b>To annotate or not to annotate</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 15,
      endContainerXPath: '//b/text()',
      endOffset: 18,
    },
    options: {},
    expected: {
      type: 'TextQuoteSelector',
      exact: 'not',
      prefix: 'or ',
      suffix: ' to',
    },
  },
  'only prefix for end of text': {
    html: '<b>To annotate or not to annotate</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 22,
      endContainerXPath: '//b/text()',
      endOffset: 30,
    },
    options: {},
    expected: {
      type: 'TextQuoteSelector',
      exact: 'annotate',
      prefix: 'to ',
      suffix: '',
    },
  },
  'only suffix for start of text': {
    html: '<b>annotate or not to annotate, yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 0,
      endContainerXPath: '//b/text()',
      endOffset: 8,
    },
    options: {},
    expected: {
      type: 'TextQuoteSelector',
      exact: 'annotate',
      prefix: '',
      suffix: ' or',
    },
  },
  'multiple, overlapping false matches': {
    html: '<b>a a a a a a a a a a</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 8,
      endContainerXPath: '//b/text()',
      endOffset: 13,
    },
    options: {},
    expected: {
      type: 'TextQuoteSelector',
      exact: 'a a a',
      prefix: 'a a a a ',
      suffix: ' a a a',
    },
  },
  'empty quote': {
    html: '<b>To annotate or not to annotate</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 11,
      endContainerXPath: '//b/text()',
      endOffset: 11,
    },
    options: {},
    expected: {
      type: 'TextQuoteSelector',
      exact: '',
      prefix: 'To annotate',
      suffix: ' or',
    },
  },
  'across elements': {
    html: '<b>To annotate or <i>not</i> to <u>anno</u>tat</b>e',
    range: {
      startContainerXPath: '//u/text()',
      startOffset: 0,
      endContainerXPath: '//b/text()[3]',
      endOffset: 2,
    },
    options: {},
    expected: {
      type: 'TextQuoteSelector',
      exact: 'annota',
      prefix: 'to ',
      suffix: 'te',
    },
  },
};

export const testCasesWithMinimalContext: DescribeTextQuoteTestCases = {
  'no context': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 12,
      endContainerXPath: '//b/text()',
      endOffset: 20,
    },
    options: {
      minimalContext: true,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'dolor am',
      prefix: '',
      suffix: '',
    },
  },
  'minimal prefix': {
    html: '<b>To annotate or not to annotate.</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 22,
      endContainerXPath: '//b/text()',
      endOffset: 26,
    },
    options: {
      minimalContext: true,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'anno',
      prefix: 'to ',
      suffix: '',
    },
  },
  'minimal suffix': {
    html: '<b>To annotate or not to annotate.</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 7,
      endContainerXPath: '//b/text()',
      endOffset: 11,
    },
    options: {
      minimalContext: true,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'tate',
      prefix: '',
      suffix: ' ',
    },
  },
  'use suffix for start of text': {
    html: '<b>to annotate or not to annotate.</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 0,
      endContainerXPath: '//b/text()',
      endOffset: 2,
    },
    options: {
      minimalContext: true,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'to',
      prefix: '',
      suffix: ' annotate ',
    },
  },
  'use prefix for end of text': {
    html: '<b>To annotate or not to annotate</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 26,
      endContainerXPath: '//b/text()',
      endOffset: 30,
    },
    options: {
      minimalContext: true,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'tate',
      prefix: 'to anno',
      suffix: '',
    },
  },
  'multiple, overlapping false matches': {
    html: '<b>aaaaaaaaaa</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 4,
      endContainerXPath: '//b/text()',
      endOffset: 7,
    },
    options: {
      minimalContext: true,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'aaa',
      prefix: 'aaaa',
      suffix: 'aaa',
    },
  },
  'empty quote': {
    html: '<b>To annotate or not to annotate</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 11,
      endContainerXPath: '//b/text()',
      endOffset: 11,
    },
    options: {
      minimalContext: true,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: '',
      prefix: 'e',
      suffix: ' ',
    },
  },
};

export const testCasesWithMinimumQuoteLength: DescribeTextQuoteTestCases = {
  'balance prefix and suffix': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 12,
      endContainerXPath: '//b/text()',
      endOffset: 17,
    },
    options: {
      minimumQuoteLength: 10,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'dolor',
      prefix: 'ipsum ',
      suffix: ' amet',
    },
  },
  'use prefix for end of text': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 28,
      endContainerXPath: '//b/text()',
      endOffset: 30,
    },
    options: {
      minimumQuoteLength: 10,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'ya',
      prefix: 'amet yada ',
      suffix: 'da',
    },
  },
  'use suffix for start of text': {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 2,
      endContainerXPath: '//b/text()',
      endOffset: 3,
    },
    options: {
      minimumQuoteLength: 10,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'r',
      prefix: 'lo',
      suffix: 'em ipsum',
    },
  },
};

export const testCasesWithMaxWordLength: DescribeTextQuoteTestCases = {
  'too long prefix': {
    html: '<b>Surely counterantidisintermediationism is too long to quote.</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 28,
      endContainerXPath: '//b/text()',
      endOffset: 31,
    },
    options: {
      maxWordLength: 10,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'dia',
      prefix: 'disinterme',
      suffix: 'tionism',
    },
  },
  'too long suffix': {
    html: '<b>Surely counterantidisintermediationism is too long to quote.</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 14,
      endContainerXPath: '//b/text()',
      endOffset: 18,
    },
    options: {
      maxWordLength: 10,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'anti',
      prefix: 'counter',
      suffix: 'disinterme',
    },
  },
  'default should be 50': {
    html:
      '<b>The chromosome is ACATATTACGTTAGATATGACACCCATATAGTTATTTATAAGATGGGACAGATATTAGTTTAAAAA</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 18,
      endContainerXPath: '//b/text()',
      endOffset: 27,
    },
    options: {},
    expected: {
      type: 'TextQuoteSelector',
      exact: 'ACATATTAC',
      prefix: '',
      suffix: 'GTTAGATATGACACCCATATAGTTATTTATAAGATGGGACAGATATTAGT',
    },
  },
};
