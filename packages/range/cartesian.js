import { AsyncTee } from '@annotator/tee';

export default cartesian;
async function* cartesian(...iterables) {
  if (iterables.length === 1) {
    for await (let item of iterables[0]) {
      yield [item];
    }
  } else {
    const head = new AsyncTee(iterables.shift());
    const rest = cartesian(...iterables);
    for await (let items of rest) {
      for await (let item of head) {
        yield [item, ...items];
      }
    }
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
