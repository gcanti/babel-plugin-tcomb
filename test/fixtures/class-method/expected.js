class A {
  foo(x: t.String): t.String {
    t.assert(t.String.is(x));

    const ret = (function (x) {
      return x;
    }).call(this, x);

    t.assert(t.String.is(ret));
    return ret;
  }

}