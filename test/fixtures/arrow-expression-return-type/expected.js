import t from 'tcomb';
const f = x => {
  t.assert(t.String.is(x));

  var ret = function (x) {
    return x;
  }.call(this, x);

  t.assert(t.String.is(ret));
  return ret;
};
