import t from 'tcomb';
function foo(x: Array<[?t.Number, t.String]>) {
  t.assert(t.is(x, t.list(t.tuple([t.maybe(t.Number), t.String]))), 'Invalid argument x (expected a ' + t.getTypeName(t.list(t.tuple([t.maybe(t.Number), t.String]))) + ')');

  return x;
}
