import t from 'tcomb';

function foo(x: t.Number, y: t.String): t.String {
  t.assert(t.is(x, t.Number), 'Invalid argument x (expected a ' + t.getTypeName(t.Number) + ')');
  t.assert(t.is(y, t.String), 'Invalid argument y (expected a ' + t.getTypeName(t.String) + ')');

  var ret = function (x, y) {
    return x + y;
  }.call(this, x, y);

  t.assert(t.is(ret, t.String), 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')');
  return ret;
}

function bar(x, y: t.String): t.String {
  t.assert(t.is(y, t.String), 'Invalid argument y (expected a ' + t.getTypeName(t.String) + ')');

  var ret = function (x, y) {
    return x + y;
  }.call(this, x, y);

  t.assert(t.is(ret, t.String), 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')');
  return ret;
}
