import t from 'tcomb';

function foo(f) {
  _assert(f, t.Function, 'f');

  return f('a');
}

function bar(f) {
  _assert(f, t.Function, 'f');

  return f('a');
}
