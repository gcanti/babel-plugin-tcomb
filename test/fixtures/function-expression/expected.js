import t from 'tcomb';
const f = function (x: t.String) {
  _assert(x, t.String, 'x');

  return x;
};
