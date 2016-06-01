import t from 'tcomb';
const f = x => {
  t.assert(t.is(x, t.String), 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')');

  const ret = function (x) {
    return x;
  }.call(this, x);

  t.assert(t.is(ret, t.String), 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')');
  return ret;
};
