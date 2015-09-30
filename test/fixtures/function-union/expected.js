function foo(x: t.String | t.Number) {
  x = t.union([t.String, t.Number])(x);

  return x;
}