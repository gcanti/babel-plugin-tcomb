interface A {
  a: string;
}

interface B extends A {
  b: string;
}

interface C extends A {}

interface D extends A, $Refinement<typeof p> {}

interface E<T> extends A {
  e: T
}

interface F<T> extends E<B> {
  e: T,
  f: B
}
