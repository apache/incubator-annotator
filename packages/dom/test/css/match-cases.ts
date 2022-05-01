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

import type { CssSelector } from '@apache-annotator/selector';

export const testCases: {
  [name: string]: {
    html: string;
    selector: CssSelector;
    scopeXPath?: string;
    expected: string[];
  };
} = {
  simple: {
    html: '<b>lorem <i>ipsum</i> dolor <i>amet</i> yada <i>yada</i></b>',
    selector: {
      type: 'CssSelector',
      value: 'i:nth-child(2)',
    },
    expected: ['//b/i[2]'],
  },
  'multiple matches': {
    html: '<b>lorem <i>ipsum</i> dolor <i>amet</i> yada <i>yada</i></b>',
    selector: {
      type: 'CssSelector',
      value: 'i',
    },
    expected: ['//b/i[1]', '//b/i[2]', '//b/i[3]'],
  },
  'with scope': {
    html: '<b>lorem <i>ipsum</i> dolor <u><i>amet</i> yada <i>yada</i></u></b>',
    selector: {
      type: 'CssSelector',
      value: 'i',
    },
    scopeXPath: '//u',
    expected: ['//u/i[1]', '//u/i[2]'],
  },
};
