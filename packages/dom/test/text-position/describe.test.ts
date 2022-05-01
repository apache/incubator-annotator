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

import { strict as assert } from 'assert';
import { describeTextPosition } from '../../src/text-position/describe.js';
import { hydrateRange } from '../utils.js';
import { testCases } from './match-cases.js';

const domParser = new DOMParser();

describe('createTextPositionSelectorMatcher', () => {
  describe('inverts test cases of text position matcher', () => {
    for (const [name, { html, selector, expected }] of Object.entries(
      testCases,
    )) {
      const range = expected[0];
      it(`case: '${name}'`, async () => {
        const doc = domParser.parseFromString(html, 'text/html');
        const result = await describeTextPosition(
          hydrateRange(range, doc),
          doc,
        );
        assert.deepEqual(result, selector);
      });
    }
  });

  it('works with a scope', () => {
    // TODO
  });

  it('works with split text nodes', () => {
    // TODO
  });

  it('works with code points split across text nodes', () => {
    // TODO
  });
});
