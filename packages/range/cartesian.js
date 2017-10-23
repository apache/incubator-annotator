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

  const nextPs = iterators.map((iterator, iterableNr) =>
    iterator
      .next()
      .then(async ({ value, done }) => ({ value: await value, done }))
      .then(
        // Label the value with iterableNr to know which one produced this value in
        // Promise.race below.
        ({ value, done }) => ({ value, done, iterableNr })
      )
  );

  while (1) {
    // Check which iterators are still active; quit if they are all exhausted.
    const nextValuePs = nextPs.filter(x => x !== null);
    if (nextValuePs.length === 0) break;

    // Wait until any of the active iterators has produced a new value.
    const { value, done, iterableNr } = await Promise.race(nextValuePs);

    // If this iterable was exhausted, stop listening to it and move on.
    if (done) {
      nextPs[iterableNr] = null;
      continue;
    }

    // Produce all combinations of the received value with the logged values
    // from the other iterables.
    const arrays = [...logs];
    arrays[iterableNr] = [value];
    const combinations = cartesianArrays(arrays);

    // Append the received value to the right log.
    logs[iterableNr] = [...logs[iterableNr], value];

    // Start listening for the next value.
    nextPs[iterableNr] = iterators[iterableNr]
      .next()
      .then(async ({ value, done }) => ({ value: await value, done }))
      .then(({ value, done }) => ({ value, done, iterableNr }));

    // Yield each of the produced combinations separately.
    yield* combinations;
  }
}

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
test();
