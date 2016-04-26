import t from 'tcomb';
function foo(x: Array<[?t.Number, t.String]>) {
  t.assert(t.list(t.tuple([t.maybe(t.Number), t.String])).is(x));

  return x;
}
