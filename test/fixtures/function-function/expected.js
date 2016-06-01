import t from 'tcomb';

function foo(f: (x: t.String) => t.String) {
  t.assert(t.is(f, t.func([t.String], t.String)), 'Invalid argument f (expected a ' + t.getTypeName(t.func([t.String], t.String)) + ')');

  return f('a');
}

function bar(f: t.Function) {
  t.assert(t.is(f, t.Function), 'Invalid argument f (expected a ' + t.getTypeName(t.Function) + ')');

  return f('a');
}
