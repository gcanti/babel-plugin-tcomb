import t from 'tcomb';
const f = function (x: t.String) {
  t.assert(t.String.is(x));

  return x;
};