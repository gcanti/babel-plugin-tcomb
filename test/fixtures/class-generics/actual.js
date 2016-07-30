class A<T> {
  foo(x: T) {}
}

type P = number;

class B extends C<P> {
  foo(x: P) {}
}

class D<T: F> extends E<T> {
  foo(x: T) {}
}
