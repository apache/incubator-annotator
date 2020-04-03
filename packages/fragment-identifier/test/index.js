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

import { parse, stringify } from '../src';

// Test examples from the spec: https://www.w3.org/TR/2017/NOTE-selectors-states-20170223/#json-examples-converted-to-fragment-identifiers
import specExamplesRaw from './spec-examples.json';

// The JSON file has the full examples; pull out the parts we need.
const specExamples = Object.fromEntries(Object.entries(specExamplesRaw).map(
  ([name, { uri, obj: { selector, state } }]) =>
    [name, { fragId: uri.split('#')[1], selector, state }]
));

describe('stringify', () => {
  // Test examples in the spec, ignoring their URI encoding
  for (const [name, example] of Object.entries(specExamples)) {
    it(`should properly stringify (disregarding URI-encoding): '${name}'`, () => {
      const result = stringify(example.selector || example.state);
      assert.equal(
        decodeURIComponent(result),
        decodeURIComponent(example.fragId)
      );
    });
  }
});

const specialCasesToParse = {
  'One closing parenthesis inside a value': {
    fragId: 'selector(type=TextQuoteSelector,exact=(not)%20a%20problem)',
    selector: {
      type: 'TextQuoteSelector',
      exact: '(not) a problem',
    },
  },

  'Two closing parenthesis inside a value': {
    fragId: 'selector(type=TextQuoteSelector,exact=Hey))%20this%20breaks)',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'Hey)) this breaks',
    },
  },

  'Two closing parentheses: one of value, one of selector': {
    fragId: 'selector(type=TextQuoteSelector,exact=example%20(that%20fails))',
    selector: {
      type: 'TextQuoteSelector',
      exact: 'example (that fails)',
    },
  },

  'Three closing parentheses: one of the value, two of nested selectors': {
    // Example from <https://github.com/w3c/web-annotation/issues/443>
    fragId: `
      selector(
        type=RangeSelector,
        startSelector=selector(type=TextQuoteSelector,exact=(but),
        endSelector=selector(type=TextQuoteSelector,exact=crazy))
      )
      `.replace(/\s/g, ''),
    selector: {
      type: 'RangeSelector',
      startSelector: {
        type: 'TextQuoteSelector',
        exact: '(but',
      },
      endSelector: {
        type: 'TextQuoteSelector',
        exact: 'crazy)',
      },
    },
  },
};

describe('parse', () => {
  const allCasesToParse = { ...specExamples, ...specialCasesToParse };
  for (const [name, example] of Object.entries(allCasesToParse)) {
    it(`should properly parse: ${name}`, () => {
      const expected = (example.selector !== undefined)
        ? { selector: example.selector }
        : { state: example.state };
      const result = parse(example.fragId);
      assert.deepEqual(result, expected);
    });
  }

  it('should throw when given an unknown type of fragment identifier', () => {
    assert.throws(() => parse('section4'));
    assert.throws(() => parse('t=3,8'));
  });
});
