import t from 'tcomb';
function foo({ x: { y: foo, z: { bar } }, a: { bob } }): t.String {
  const ret = function ({ x: { y: foo, z: { bar } }, a: { bob } }) {
    return bar;
  }.call(this, { x: { y: foo, z: { bar } }, a: { bob } });

  t.assert(t.is(ret, t.String), 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')');
  return ret;
}
