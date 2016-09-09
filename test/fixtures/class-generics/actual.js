class A<T> {
  foo(x: T) {}
}

type P = number;

class B extends C<P> {
  foo(x: P) {}
}
