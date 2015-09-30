function foo(x: Array<[?t.Number, t.String]>) {
  x = t.list(t.tuple([t.maybe(t.Number), t.String]))(x);

  return x;
}
