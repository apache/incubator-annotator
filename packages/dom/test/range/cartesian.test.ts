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
import { cartesian } from '../../src/range/cartesian.js';

async function* gen1() {
  yield 1;
  yield Promise.resolve(2);
  yield 3;
}

async function* gen2() {
  yield 4;
}

async function* gen3() {
  yield 5;
  yield 6;
}

describe('cartesian', () => {
  it('yields the cartesian product of the yielded items', async () => {
    const cart = cartesian(gen1(), gen2(), gen3());

    const expected = [
      [1, 4, 5],
      [2, 4, 5],
      [3, 4, 5],
      [1, 4, 6],
      [2, 4, 6],
      [3, 4, 6],
    ];

    const actual: number[][] = [];
    for await (const value of cart) {
      actual.push(value);
    }

    assert.deepEqual(actual, expected, 'yields the expected items');
  });

  it('re-raises exceptions and closes iterators', async () => {
    let didClose = false;
    const error = new Error();

    async function* throws() {
      yield 1;
      throw error;
    }

    async function* works() {
      try {
        yield 2;
        yield 3;
      } finally {
        didClose = true;
      }
    }

    try {
      // eslint-disable-next-line
      const cart = cartesian(throws(), works());
      await cart.next();
      await cart.next();
    } catch (e) {
      assert.strictEqual(error, e, 're-raises an error from an iterable');
      assert.strictEqual(didClose, true, 'closes the iterators');
    }
  });
});
