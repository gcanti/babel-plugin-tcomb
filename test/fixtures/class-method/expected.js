class A {
  f(x: t.String): t.String {
    x = t.String(x);

    const ret = function (x) {
      return x;
    }(x);

    return t.String(ret);
  }
}