import t from 'tcomb';
const f = function (x: t.String) {
  t.assert(t.String.is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')');

  return x;
};
