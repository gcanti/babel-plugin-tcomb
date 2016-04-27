import t from 'tcomb';
function foo({ x: { y: foo, z: { bar } }, a: { bob } }) : t.String {
  return bar;
}