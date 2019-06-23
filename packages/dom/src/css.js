export function createCssSelector(selector) {
  return async function* matchAll(scope) {
    yield* scope.querySelectorAll(selector.value);
  };
}
