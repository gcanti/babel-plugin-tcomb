import t from 'tcomb';

function foo(x: t.Number, y: t.String): t.String {
  t.assert(t.Number.is(x), function () {
    t.Number(x);
    return 'Invalid argument x (expected a ' + t.getTypeName(t.Number) + ')';
  });
  t.assert(t.String.is(y), function () {
    t.String(y);
    return 'Invalid argument y (expected a ' + t.getTypeName(t.String) + ')';
  });

  var ret = (function (x, y) {
    return x + y;
  }).call(this, x, y);

  t.assert(t.String.is(ret), function () {
    t.String(ret);
    return 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')';
  });
  return ret;
}

function bar(x, y: t.String): t.String {
  t.assert(t.String.is(y), function () {
    t.String(y);
    return 'Invalid argument y (expected a ' + t.getTypeName(t.String) + ')';
  });

  var ret = (function (x, y) {
    return x + y;
  }).call(this, x, y);

  t.assert(t.String.is(ret), function () {
    t.String(ret);
    return 'Invalid argument ret (expected a ' + t.getTypeName(t.String) + ')';
  });
  return ret;
}
