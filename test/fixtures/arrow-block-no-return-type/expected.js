import t from 'tcomb';
const f = x => {
  t.assert(t.String.is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')');

  return x;
};
