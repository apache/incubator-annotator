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

import { describeTextQuote } from '../../src/text-quote/describe';
import { hydrateRange, evaluateXPath } from '../utils';

import { testCases } from './describe-cases';
import { testCases as testMatchCases } from './match-cases';

const domParser = new window.DOMParser();

describe('describeTextQuote', () => {
  for (const [name, { html, range, expected }] of Object.entries(testCases)) {
    it(`works for case: ${name}`, async () => {
      const doc = domParser.parseFromString(html, 'text/html');
      const scope = doc.createRange();
      scope.selectNodeContents(doc);
      const result = await describeTextQuote(hydrateRange(range, doc), scope);
      assert.deepEqual(result, expected);
    });
  }

  it('works with custom scope', async () => {
    const { html, range } = testCases['minimal prefix'];
    const doc = domParser.parseFromString(html, 'text/html');
    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b/text()'), 15);
    scope.setEnd(evaluateXPath(doc, '//b/text()'), 30); // "not to annotate"
    const result = await describeTextQuote(hydrateRange(range, doc), scope);
    assert.deepEqual(result, {
      exact: 'anno',
      prefix: '', // no prefix needed in this scope.
      suffix: '',
    });
  });

  it('strips part of the range outside the scope', async () => {
    const { html, range } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');
    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b/text()'), 6);
    scope.setEnd(evaluateXPath(doc, '//b/text()'), 17); // "ipsum dolor"
    const result = await describeTextQuote(hydrateRange(range, doc), scope);
    assert.deepEqual(result, {
      exact: 'dolor',
      prefix: '',
      suffix: '',
    });
  });

  it('works if the range equals the scope', async () => {
    const { html, range, expected } = testCases['simple'];
    const doc = domParser.parseFromString(html, 'text/html');
    const result = await describeTextQuote(
      hydrateRange(range, doc),
      hydrateRange(range, doc),
    );
    assert.deepEqual(result, expected);
  });

  describe('inverts test cases of text quote matcher', () => {
    const applicableTestCases = Object.entries(testMatchCases).filter(
      ([_, { expected }]) => expected.length > 0,
    );

    for (const [name, { html, selector, expected }] of applicableTestCases) {
      it(`case: '${name}'`, async () => {
        const doc = domParser.parseFromString(html, 'text/html');
        const scope = doc.createRange();
        scope.selectNodeContents(doc);
        for (const rangeInfo of expected) {
          const range = hydrateRange(rangeInfo, doc);
          const result = await describeTextQuote(range, scope);
          assert.equal(result.exact, selector.exact);
          // Our result may have a different combination of prefix/suffix; only check for obvious inconsistency.
          if (selector.prefix && result.prefix)
            assert(
              selector.prefix.endsWith(
                result.prefix.substring(
                  result.prefix.length - selector.prefix.length,
                ),
              ),
              'Inconsistent prefixes',
            );
          if (selector.suffix && result.suffix)
            assert(
              selector.suffix.startsWith(
                result.suffix.substring(0, selector.suffix.length),
              ),
              'Inconsistent suffixes',
            );
        }
      });
    }
  });
});
