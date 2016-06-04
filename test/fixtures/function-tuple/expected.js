import t from 'tcomb';

function foo(x: [t.String, t.Number]) {
  _assert(x, t.tuple([t.String, t.Number]), 'x');

  return x;
}
