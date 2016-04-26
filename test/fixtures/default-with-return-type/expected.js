import t from 'tcomb';
function foo(x = 'foo': t.String): t.String {
  t.assert(t.String.is(x));

  var ret = function (x) {
    return x;
  }.call(this, x);

  t.assert(t.String.is(ret));
  return ret;
}
