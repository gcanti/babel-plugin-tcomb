function foo(x: t.Number, y: t.String): t.String {
  x = t.Number(x);
  y = t.String(y);

  const ret = function (x, y) {
    return x + y;
  }.call(this, x, y);

  return t.String(ret);
}

function bar(x, y: t.String): t.String {
  y = t.String(y);

  const ret = function (x, y) {
    return x + y;
  }.call(this, x, y);

  return t.String(ret);
}
