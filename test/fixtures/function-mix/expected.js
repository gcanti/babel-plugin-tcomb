import t from 'tcomb';
function foo(x) {
  _assert(x, t.list(t.tuple([t.maybe(t.Number), t.String])), 'x');

  return x;
}
