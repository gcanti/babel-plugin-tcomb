function foo(x: Array<t.String>) {
  t.assert(t.list(t.String).is(x));

  return x;
}

function bar(x: t.String[]) {
  t.assert(t.list(t.String).is(x));

  return x;
}