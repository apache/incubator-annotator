import cartesianArrays from 'cartesian';

export default cartesian;
async function* cartesian(...iterables) {
  // We listen to all iterators in parallel, while logging all the values they
  // produce. Whenever an iterator produces a value, we produce and yield all
  // combinations of that value with the logged values from other iterators.
  // Every combination is thus made exactly once, and as soon as it is known.

  const iterators = iterables.map(iterable => iterable[Symbol.asyncIterator]());
  // Initialise an empty log for each iterable.
  const logs = iterables.map(() => []);

  const nextValuePromises = iterators.map((iterator, iterableNr) =>
    iterator
      .next()
      .then(async ({ value, done }) => ({ value: await value, done }))
      .then(
        // Label the result with iterableNr, to know which iterable produced
        // this value after Promise.race below.
        ({ value, done }) => ({ value, done, iterableNr })
      )
  );

  // Keep listening as long as any of the iterables is not yet exhausted.
  while (nextValuePromises.some(p => p !== null)) {
    // Wait until any of the active iterators has produced a new value.
    const { value, done, iterableNr } = await Promise.race(
      nextValuePromises.filter(p => p !== null)
    );

    // If this iterable was exhausted, stop listening to it and move on.
    if (done) {
      nextValuePromises[iterableNr] = null;
      continue;
    }

    // Produce all combinations of the received value with the logged values
    // from the other iterables.
    const arrays = [...logs];
    arrays[iterableNr] = [value];
    const combinations = cartesianArrays(arrays);

    // Append the received value to the right log.
    logs[iterableNr] = [...logs[iterableNr], value];

    // Start listening for the next value of this iterable.
    nextValuePromises[iterableNr] = iterators[iterableNr]
      .next()
      .then(async ({ value, done }) => ({ value: await value, done }))
      .then(({ value, done }) => ({ value, done, iterableNr }));

    // Yield each of the produced combinations separately.
    yield* combinations;
  }
}

// eslint-disable-next-line no-unused-vars
async function test() {
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

  const cart = cartesian(gen1(), gen2(), gen3());

  // eslint-disable-next-line no-unused-vars
  const expected = [
    [1, 4, 5],
    [2, 4, 5],
    [3, 4, 5],
    [1, 4, 6],
    [2, 4, 6],
    [3, 4, 6],
  ];

  const result = [];
  for await (let value of cart) {
    result.push(value);
  }
  // TODO assert that result equals expected.
}
