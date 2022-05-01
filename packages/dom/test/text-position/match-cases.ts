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

import type { TextPositionSelector } from '@apache-annotator/selector';
import type { RangeInfo } from '../utils.js';

export const testCases: {
  [name: string]: {
    html: string;
    selector: TextPositionSelector;
    expected: RangeInfo[];
  };
} = {
  simple: {
    html: '<b>l😃rem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextPositionSelector',
      start: 12,
      end: 20,
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 13,
        endContainerXPath: '//b/text()',
        endOffset: 21,
      },
    ],
  },
  'first characters': {
    html: '<b>l😃rem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextPositionSelector',
      start: 0,
      end: 11,
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 0,
        endContainerXPath: '//b/text()',
        endOffset: 12,
      },
    ],
  },
  'last characters': {
    html: '<b>l😃rem ipsum dolor amet yada yada</b>',
    selector: {
      type: 'TextPositionSelector',
      start: 23,
      end: 32,
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 24,
        endContainerXPath: '//b/text()',
        endOffset: 33,
      },
    ],
  },
  'across elements': {
    html: '<b>l😃rem <i>ipsum</i> dolor <u>amet</u> yada yada</b>',
    selector: {
      type: 'TextPositionSelector',
      start: 12,
      end: 20,
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
    html: '<b>l😃rem <i>ipsum dolor</i> amet yada yada</b>',
    selector: {
      type: 'TextPositionSelector',
      start: 6,
      end: 17,
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
    html: '<head><title>l😃rem ipsum dolor amet</title></head><b>yada yada</b>',
    selector: {
      type: 'TextPositionSelector',
      start: 18,
      end: 22,
    },
    expected: [
      {
        startContainerXPath: '//title/text()',
        startOffset: 19,
        endContainerXPath: '//b/text()[1]',
        endOffset: 0,
      },
    ],
  },
  'empty quote': {
    html: '<b>l😃rem</b>',
    selector: {
      type: 'TextPositionSelector',
      start: 3,
      end: 3,
    },
    expected: [
      {
        startContainerXPath: '//b/text()',
        startOffset: 4,
        endContainerXPath: '//b/text()',
        endOffset: 4,
      },
    ],
  },
};
