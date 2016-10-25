import t from 'tcomb';
function foo({ x: { y: foo, z: { bar } }, a: { bob } }) {
  const ret = function ({
    x: {
      y: foo,
      z: {
        bar
      }
    },
    a: {
      bob
    }
  }) {
    return bar;
  }.call(this, {
    x,
    a
  });

  _assert(ret, t.String, 'return value');

  return ret;
}
