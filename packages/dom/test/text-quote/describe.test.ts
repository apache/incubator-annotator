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
import { describeTextQuote } from '../../src/text-quote/describe.js';
import { hydrateRange, evaluateXPath } from '../utils.js';
import type { DescribeTextQuoteTestCases } from './describe-cases.js';
import {
  testCasesWithMinimumQuoteLength,
  testCasesWithMaxWordLength,
  testCasesWithMinimalContext,
  testCasesWithoutOptions,
} from './describe-cases.js';
import { testCases as testMatchCases } from './match-cases.js';

const domParser = new DOMParser();

function runTestCases(testCases: DescribeTextQuoteTestCases) {
  for (const [name, { html, range, expected, options }] of Object.entries(
    testCases,
  )) {
    it(`works for case: ${name}`, async () => {
      const doc = domParser.parseFromString(html, 'text/html');
      const result = await describeTextQuote(
        hydrateRange(range, doc),
        doc,
        options,
      );
      assert.deepEqual(result, expected);
    });
  }
}

describe('describeTextQuote', () => {
  describe('without options', () => {
    runTestCases(testCasesWithoutOptions);
  });

  describe('with minimal context', () => {
    runTestCases(testCasesWithMinimalContext);
  });

  describe('with minimum quote length', () => {
    runTestCases(testCasesWithMinimumQuoteLength);
  });

  describe('with max word length', () => {
    runTestCases(testCasesWithMaxWordLength);
  });

  it('works with custom scope', async () => {
    const { html, range, options } = testCasesWithMinimalContext[
      'minimal prefix'
    ];
    const doc = domParser.parseFromString(html, 'text/html');
    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b/text()'), 15);
    scope.setEnd(evaluateXPath(doc, '//b/text()'), 30); // "not to annotate"
    const result = await describeTextQuote(
      hydrateRange(range, doc),
      scope,
      options,
    );
    assert.deepEqual(result, {
      type: 'TextQuoteSelector',
      exact: 'anno',
      prefix: '', // no prefix needed in this scope.
      suffix: '',
    });
  });

  it('strips part of the range outside the scope', async () => {
    const { html, range, options } = testCasesWithMinimalContext['no context'];
    const doc = domParser.parseFromString(html, 'text/html');
    const scope = doc.createRange();
    scope.setStart(evaluateXPath(doc, '//b/text()'), 6);
    scope.setEnd(evaluateXPath(doc, '//b/text()'), 17); // "ipsum dolor"
    const result = await describeTextQuote(
      hydrateRange(range, doc),
      scope,
      options,
    );
    assert.deepEqual(result, {
      type: 'TextQuoteSelector',
      exact: 'dolor',
      prefix: '',
      suffix: '',
    });
  });

  it('works if the range equals the scope', async () => {
    const { html, range, expected, options } = testCasesWithMinimalContext[
      'no context'
    ];
    const doc = domParser.parseFromString(html, 'text/html');
    const result = await describeTextQuote(
      hydrateRange(range, doc),
      hydrateRange(range, doc),
      options,
    );
    assert.deepEqual(result, expected);
  });

  it('works if range does not contain Text nodes', async () => {
    const html = `<b>Try quoting this image: <img/> — would that work?</b>`;
    const doc = domParser.parseFromString(html, 'text/html');
    const range = document.createRange();
    range.selectNode(evaluateXPath(doc, '//img'));
    const result = await describeTextQuote(range, doc);
    assert.deepEqual(result, {
      type: 'TextQuoteSelector',
      exact: '',
      prefix: 'image: ',
      suffix: ' —',
    });
  });

  describe('inverts test cases of text quote matcher', () => {
    const applicableTestCases = Object.entries(testMatchCases).filter(
      ([_, { expected }]) => expected.length > 0,
    );

    for (const [name, { html, selector, expected }] of applicableTestCases) {
      it(`case: '${name}'`, async () => {
        const doc = domParser.parseFromString(html, 'text/html');
        for (const rangeInfo of expected) {
          const range = hydrateRange(rangeInfo, doc);
          const result = await describeTextQuote(range, doc);
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
