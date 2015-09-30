function foo(x: t.Number & t.String) {
  x = t.intersection([t.Number, t.String])(x);

  return x;
}
