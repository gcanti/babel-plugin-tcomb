import t from 'tcomb';

function foo(x: t.String | t.Number) {
  _assert(x, t.union([t.String, t.Number]), 'x');

  return x;
}
