import t from 'tcomb';

function foo(x = 'foo': t.String): t.String {
  t.assert(t.String.is(x), function () {
    t.String(x);
    return 'Invalid argument x (expected a ' + t.getTypeName(t.String) + ')';
  });

  var ret = (function (x) {
    return x;
  }).call(this, x);

  t.assert(t.String.is(ret), function () {
    t.String(ret);
    return 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')';
  });
  return ret;
}
