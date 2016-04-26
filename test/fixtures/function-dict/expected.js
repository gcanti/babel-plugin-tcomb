import t from 'tcomb';
function foo(x: { [key: t.String]: t.Number }) {
  t.assert(t.dict(t.String, t.Number).is(x));

  return x;
}
