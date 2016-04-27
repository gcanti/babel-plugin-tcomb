import t from 'tcomb';

function foo({ x: { y: foo, z: { bar } }, a: { bob } }): t.String {
  const ret = (function (foo, bar, bob) {
    return bar;
  }).call(this, foo, bar, bob);

  t.assert(t.String.is(ret));
  return ret;
}