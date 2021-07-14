/**
 * SPDX-FileCopyrightText: 2016-2021 The Apache Software Foundation
 * SPDX-License-Identifier: Apache-2.0
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

/**
 * Generates the Cartesian product of the sets generated by the given iterables.
 *
 *   𝑆₁ × ... × 𝑆ₙ = { (𝑒₁,...,𝑒ₙ) | 𝑒ᵢ ∈ 𝑆ᵢ }
 */
export async function* cartesian<T>(
  ...iterables: (Iterable<T> | AsyncIterable<T>)[]
): AsyncGenerator<T[], void, undefined> {
  // Create iterators for traversing each iterable and tagging every value
  // with the index of its source iterable.
  const iterators = iterables.map((iterable, index) => {
    const generator = async function* () {
      for await (const value of iterable) {
        yield { index, value };
      }
      return { index };
    };
    return generator();
  });

  try {
    // Track the number of non-exhausted iterators.
    let active = iterators.length;

    // Track all the values of each iterator in a log.
    const logs = iterators.map(() => []) as T[][];

    // Track the promise of the next value of each iterator.
    const nexts = iterators.map((it) => it.next());

    // Iterate the values of all the iterators in parallel and yield tuples from
    // the partial product of each new value and the existing logs of the other
    // iterators.
    while (active) {
      // Wait for the next result.
      const result = await Promise.race(nexts);
      const { index } = result.value;

      // If the iterator has exhausted all the values, set the promise
      // of its next value to never resolve.
      if (result.done) {
        active--;
        nexts[index] = new Promise(() => undefined);
        continue;
      }

      // Append the new value to the log.
      const { value } = result.value;
      logs[index].push(value);

      // Record the promise of the next value.
      nexts[index] = iterators[index].next();

      // Create a scratch input for computing a partial product.
      const scratch = [...logs];
      scratch[index] = [value];

      // Synchronously compute and yield tuples of the partial product.
      yield* scratch.reduce(
        (acc, next) => acc.flatMap((v) => next.map((w) => [...v, w])),
        [[]] as T[][],
      );
    }
  } finally {
    const closeAll = iterators.map((it, index) => it.return({ index }));
    await Promise.all(closeAll);
  }
}
