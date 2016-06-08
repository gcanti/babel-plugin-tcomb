import t from 'tcomb';
function foo(x) {
  _assert(x, t.maybe(t.String), 'x');

  return x;
}
