import t from 'tcomb';
function foo(x: t.Number & t.String) {
  t.assert(t.intersection([t.Number, t.String]).is(x));

  return x;
}
