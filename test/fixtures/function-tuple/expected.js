import t from 'tcomb';

function foo(x) {
  _assert(x, t.tuple([t.String, t.Number]), 'x');

  return x;
}
