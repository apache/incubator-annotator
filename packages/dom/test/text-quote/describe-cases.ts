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

import { TextQuoteSelector } from '@annotator/selector';

import { RangeInfo } from './utils';

const testCases: {
  [name: string]: {
    html: string;
    range: RangeInfo;
    expected: TextQuoteSelector;
  };
} = {
  simple: {
    html: '<b>lorem ipsum dolor amet yada yada</b>',
    range: {
      startContainerXPath: '//b/text()',
      startOffset: 12,
      endContainerXPath: '//b/text()',
      endOffset: 20,
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
    expected: {
      type: 'TextQuoteSelector',
      exact: 'tate',
      prefix: 'to anno',
      suffix: '',
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
    expected: {
      type: 'TextQuoteSelector',
      exact: '',
      prefix: 'e',
      suffix: ' ',
    },
  },
  'across elements': {
    html: '<b>To annotate or <i>not</i> to <u>anno</u>tate</b>',
    range: {
      startContainerXPath: '//u/text()',
      startOffset: 0,
      endContainerXPath: '//b/text()[3]',
      endOffset: 2,
    },
    expected: {
      type: 'TextQuoteSelector',
      exact: 'annota',
      prefix: 'to ',
      suffix: '',
    },
  },
};

export default testCases;
