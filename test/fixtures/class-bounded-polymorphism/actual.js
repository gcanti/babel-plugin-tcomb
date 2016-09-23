type Type = { test: string };

class A<T: Type> {
  foo(x: T) {
    const y: T = x;
  }
}

class B extends A<Type> {
  foo(x: Type) {
    const y: Type = x;
  }
}

class D<T: F> extends E<T> {
  foo(x: T) {
    const y: T = x;
  }
}
