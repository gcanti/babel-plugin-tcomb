import t from 'tcomb';

function foo(x: string) {
  _assert(x, t.String, 'x');

  return x;
}