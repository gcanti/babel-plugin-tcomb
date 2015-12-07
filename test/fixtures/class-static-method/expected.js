class A {
  static f(x: t.String) {
    t.assert(t.String.is(x));

    return x;
  }
}