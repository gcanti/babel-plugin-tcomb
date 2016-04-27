import t from 'tcomb';

function foo(f: (x: t.String) => t.String) {
  t.assert(t.func([t.String], t.String).is(f), 'Invalid argument f (expected a ' + t.getTypeName(t.func([t.String], t.String)) + ')');

  return f('a');
}

function bar(f: t.Function) {
  t.assert(t.Function.is(f), 'Invalid argument f (expected a ' + t.getTypeName(t.Function) + ')');

  return f('a');
}
