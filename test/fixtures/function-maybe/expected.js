import t from 'tcomb';
function foo(x: ?t.String) {
  _assert(x, t.maybe(t.String), 'x');

  return x;
}
