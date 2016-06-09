import t from 'tcomb';

function foo(x) {
  _assert(x, t.String, 'x');

  return x;
}