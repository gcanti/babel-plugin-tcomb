import t from 'tcomb';

function foo(f: (x: t.String) => t.String) {
  t.assert(t.func([t.String], t.String).is(f));

  return f('a');
}

function bar(f: t.Function) {
  t.assert(t.Function.is(f));

  return f('a');
}