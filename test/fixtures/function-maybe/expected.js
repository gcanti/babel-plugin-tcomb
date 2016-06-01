import t from 'tcomb';
function foo(x: ?t.String) {
  t.assert(t.is(x, t.maybe(t.String)), 'Invalid argument x (expected a ' + t.getTypeName(t.maybe(t.String)) + ')');

  return x;
}
