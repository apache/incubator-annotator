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

import cartesianArrays from 'cartesian';

export async function* product<T>(...iterables: AsyncIterable<T>[]): AsyncGenerator<Array<T>, void, undefined> {
  // We listen to all iterators in parallel, while logging all the values they
  // produce. Whenever an iterator produces a value, we produce and yield all
  // combinations of that value with the logged values from other iterators.
  // Every combination is thus made exactly once, and as soon as it is known.

  const iterators = iterables.map(iterable => iterable[Symbol.asyncIterator]());
  // Initialise an empty log for each iterable.
  const logs: T[][] = iterables.map(() => []);

  type NumberedResultPromise = Promise<{
    nextResult: IteratorResult<T>,
    iterableNr: number
  }>;

  function notNull(p: NumberedResultPromise | null): p is NumberedResultPromise {
    return p !== null
  }

  const nextValuePromises: Array<NumberedResultPromise | null> = iterators.map((iterator, iterableNr) =>
    iterator
      .next()
      .then(
        // Label the result with iterableNr, to know which iterable produced
        // this value after Promise.race below.
        nextResult => ({ nextResult, iterableNr }),
      ),
  );

  // Keep listening as long as any of the iterables is not yet exhausted.
  while (nextValuePromises.some(notNull)) {
    // Wait until any of the active iterators has produced a new value.
    const { nextResult, iterableNr } = await Promise.race(
      nextValuePromises.filter(notNull),
    );

    // If this iterable was exhausted, stop listening to it and move on.
    if (nextResult.done === true) {
      nextValuePromises[iterableNr] = null;
      continue;
    }

    // Produce all combinations of the received value with the logged values
    // from the other iterables.
    const arrays = [...logs];
    arrays[iterableNr] = [nextResult.value];
    const combinations: T[][] = cartesianArrays(arrays);

    // Append the received value to the right log.
    logs[iterableNr] = [...logs[iterableNr], nextResult.value];

    // Start listening for the next value of this iterable.
    nextValuePromises[iterableNr] = iterators[iterableNr]
      .next()
      .then(nextResult => ({ nextResult, iterableNr }));

    // Yield each of the produced combinations separately.
    yield* combinations;
  }
}
