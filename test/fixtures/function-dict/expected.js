function foo(x: { [key: t.String]: t.Number }) {
  x = t.dict(t.String, t.Number)(x);

  return x;
}
