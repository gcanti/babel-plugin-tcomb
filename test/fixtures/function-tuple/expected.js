function foo(x: [t.String, t.Number]) {
  x = t.tuple([t.String, t.Number])(x);

  return x;
}
