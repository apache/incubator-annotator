declare module 'cartesian' {
  export default function cartesian<T>(list: Array<Array<T>> | { [k: string]: Array<T> }): Array<Array<T>>;
}
