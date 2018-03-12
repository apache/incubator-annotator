import { product } from '../lib/cartesian.mjs';

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
  describe('product', () => {
    it('yields the cartesian product of the yielded items', async () => {
      const cart = product(gen1(), gen2(), gen3());

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

      assert.sameDeepMembers(expected, result, 'yields the expected items');
    });
  });
});
