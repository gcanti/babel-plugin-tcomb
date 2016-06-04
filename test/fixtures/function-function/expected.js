import t from 'tcomb';

function foo(f: (x: t.String) => t.String) {
  _assert(f, t.func([t.String], t.String), 'f');

  return f('a');
}

function bar(f: t.Function) {
  _assert(f, t.Function, 'f');

  return f('a');
}
