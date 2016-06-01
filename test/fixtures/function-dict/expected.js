import t from 'tcomb';
function foo(x: { [key: t.String]: t.Number }) {
  t.assert(t.is(x, t.dict(t.String, t.Number)), 'Invalid argument x (expected a ' + t.getTypeName(t.dict(t.String, t.Number)) + ')');

  return x;
}
