import t from 'tcomb';
function foo(x: t.Number, y: t.String) {
  t.assert(t.is(x, t.Number), 'Invalid argument x (expected a ' + t.getTypeName(t.Number) + ')');
  t.assert(t.is(y, t.String), 'Invalid argument y (expected a ' + t.getTypeName(t.String) + ')');

  return x + y;
}
