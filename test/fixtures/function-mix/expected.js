import t from 'tcomb';

function foo(x: Array<[?t.Number, t.String]>) {
  t.assert(t.list(t.tuple([t.maybe(t.Number), t.String])).is(x), function () {
    t.list(t.tuple([t.maybe(t.Number), t.String]))(x);
    return 'Invalid argument x (expected a ' + t.getTypeName(t.list(t.tuple([t.maybe(t.Number), t.String]))) + ')';
  });

  return x;
}
