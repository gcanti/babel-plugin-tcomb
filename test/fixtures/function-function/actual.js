import t from 'tcomb';

function foo(f: (x: t.String) => t.String) {
  return f('a');
}

function bar(f: t.Function) {
  return f('a');
}
