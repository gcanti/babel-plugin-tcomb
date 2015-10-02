function foo(f: (x: t.String) => t.String) {
  f = t.Function(f);

  return f('a');
}