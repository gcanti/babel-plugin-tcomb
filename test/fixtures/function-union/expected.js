import t from 'tcomb';

function foo(x) {
  _assert(x, t.union([t.String, t.Number]), 'x');

  return x;
}
