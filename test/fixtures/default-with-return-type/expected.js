import t from 'tcomb';
function foo(x = 'foo': t.String): t.String {
  t.assert(t.is(x, t.String), 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')');

  var ret = function (x) {
    return x;
  }.call(this, x);

  t.assert(t.is(ret, t.String), 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')');
  return ret;
}
