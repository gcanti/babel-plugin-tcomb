import t from 'tcomb';
function foo(x: t.Number & t.String) {
  _assert(x, t.intersection([t.Number, t.String]), 'x');

  return x;
}
