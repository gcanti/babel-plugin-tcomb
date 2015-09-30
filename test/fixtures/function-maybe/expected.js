function foo(x: ?t.String) {
  x = t.maybe(t.String)(x);

  return x || 'Empty';
}