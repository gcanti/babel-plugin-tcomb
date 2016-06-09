import t from 'tcomb';
function foo(x) {
  _assert(x, t.intersection([t.Number, t.String]), 'x');

  return x;
}
