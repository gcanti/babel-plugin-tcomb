function foo(x: Array<t.String>) {
  x = t.list(t.String)(x);

  return x;
}

function bar(x: t.String[]) {
  x = t.list(t.String)(x);

  return x;
}