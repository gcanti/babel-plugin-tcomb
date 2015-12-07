function foo(x: t.Number, y: t.String) {
  t.assert(t.Number.is(x));
  t.assert(t.String.is(y));

  return x + y;
}

