class A<T> {
  foo(x: T) {}
}

class B extends C<T> {
  foo(x: T) {}
}

class D<T: F> extends E<T> {
  foo(x: T) {}
}
