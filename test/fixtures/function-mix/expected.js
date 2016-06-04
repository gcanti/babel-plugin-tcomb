import t from 'tcomb';
function foo(x: Array<[?t.Number, t.String]>) {
  _assert(x, t.list(t.tuple([t.maybe(t.Number), t.String])), 'x');

  return x;
}
