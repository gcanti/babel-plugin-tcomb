class A {
  foo(x: t.String): t.String {
    x = t.String(x);

    const ret = function (x) {
      return x;
    }.call(this, x);

    return t.String(ret);
  }
}