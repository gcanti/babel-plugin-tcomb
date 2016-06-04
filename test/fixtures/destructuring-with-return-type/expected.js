import t from 'tcomb';
function foo({ x: { y: foo, z: { bar } }, a: { bob } }): t.String {
  const ret = function ({ x: { y: foo, z: { bar } }, a: { bob } }) {
    return bar;
  }.call(this, { x: { y: foo, z: { bar } }, a: { bob } });

  _assert(ret, t.String, 'return value');

  return ret;
}
