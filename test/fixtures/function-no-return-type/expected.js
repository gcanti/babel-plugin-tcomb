import t from 'tcomb';

function foo(x: t.Number, y: t.String) {
  t.assert(t.Number.is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.Number) + ')');
  t.assert(t.String.is(y), 'Invalid argument y (expected a ' + t.getTypeName(t.String) + ')');

  return x + y;
}
