import t from 'tcomb';

function foo(x: number) {
  _assert(x, t.Number, 'x');

  return x;
}