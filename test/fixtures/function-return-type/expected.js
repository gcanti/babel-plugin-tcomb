function foo(x: t.Number, y: t.String): t.String {
  t.assert(t.Number.is(x));
  t.assert(t.String.is(y));

  const ret = (function (x, y) {
    return x + y;
  }).call(this, x, y);

  t.assert(t.String.is(ret));
  return ret;
}

function bar(x, y: t.String): t.String {
  t.assert(t.String.is(y));

  const ret = (function (x, y) {
    return x + y;
  }).call(this, x, y);

  t.assert(t.String.is(ret));
  return ret;
}
