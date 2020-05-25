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

import { assert } from 'chai';
import { describeTextQuote } from '../src/text-quote/describe';
import testMatchCases from './text-quote-match-cases';
import { hydrateRange } from './utils';

const domParser = new window.DOMParser();

describe('describeTextQuote', () => {
  describe('inverts test cases of text quote matcher', () => {
    const applicableTestCases = Object.entries(testMatchCases)
      .filter(([_, { expected }]) => expected.length > 0);

    for (const [name, { html, selector, expected }] of applicableTestCases) {
      it(`case: '${name}'`, async () => {
        const doc = domParser.parseFromString(html, 'text/html');
        for (const rangeInfo of expected) {
          const range = hydrateRange(rangeInfo, doc);
          const result = await describeTextQuote(range, doc);
          assert.equal(result.exact, selector.exact);
          // Our result may have a different combination of prefix/suffix; only check for obvious inconsistency.
          if (selector.prefix && result.prefix)
            assert(selector.prefix.endsWith(result.prefix.substring(result.prefix.length - selector.prefix.length)), 'Inconsistent prefixes');
          if (selector.suffix && result.suffix)
            assert(selector.suffix.startsWith(result.suffix.substring(0, selector.suffix.length)), 'Inconsistent suffixes');
        }
      });
    }
  });
});
