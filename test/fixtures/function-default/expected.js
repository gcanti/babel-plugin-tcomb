function foo(x: t.Number, y = 1: t.Number) {
  t.assert(t.Number.is(x));
  t.assert(t.Number.is(y));

  return x + y;
}
