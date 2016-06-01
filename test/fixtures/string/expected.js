import t from 'tcomb';

function foo(x: string) {
  t.assert(t.is(x, t.String), 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')');

  return x;
}