import t from 'tcomb';
function foo(x: t.Number & t.String) {
  t.assert(t.is(x, t.intersection([t.Number, t.String])), 'Invalid argument x (expected a ' + t.getTypeName(t.intersection([t.Number, t.String])) + ')');

  return x;
}
