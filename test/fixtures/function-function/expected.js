function foo(f: (x: t.String) => t.String) {
  f = t.func([t.String], t.String)(f);

  return f('a');
}

function bar(f: t.Function) {
  f = t.Function(f);

  return f('a');
}