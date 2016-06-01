import t from 'tcomb';
const f = x => {
  t.assert(t.is(x, t.String), 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')');
  return x;
};
