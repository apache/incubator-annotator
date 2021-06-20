// Partial declaration, just to cover the pieces we need.
declare module 'optimal-select' {
  export default function optimalSelect(
    element: Element,
    options: {
      root: Node,
    },
  ): string;
}
