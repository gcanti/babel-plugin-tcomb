import t from 'tcomb';

function foo(x: t.String | t.Number) {
  t.assert(t.union([t.String, t.Number]).is(x));

  return x;
}