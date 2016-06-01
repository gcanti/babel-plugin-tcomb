import t from 'tcomb';

function foo(x: number) {
  t.assert(t.is(x, t.Number), 'Invalid argument x (expected a ' + t.getTypeName(t.Number) + ')');

  return x;
}