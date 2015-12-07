function foo(x = 0, y: t.String) {
  t.assert(t.String.is(y));

  return x + y;
}
