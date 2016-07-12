type Type = { test: string };

class A<T> {
  foo(x: T) {
    let y: T = x;
    y = x;
  }
}

class B<T: Type> {
  foo(x: T) {
    const y: T = x;
  }
}

class C extends B<Type> {
  foo(x: Type) {
    const y: Type = x;
  }
}

class D<T: F> extends E<T> {
  foo(x: T) {
    const y: T = x;
  }
}
