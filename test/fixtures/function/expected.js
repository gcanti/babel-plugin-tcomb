function a(x: t.Number, y: t.String): t.String {
  x = t.Number(x);
  y = t.String(y);

  const ret = function (x, y) {
    return x + y;
  }(x, y);

  return t.String(ret);
}

function b(x: t.Number, y: t.String) {
  x = t.Number(x);
  y = t.String(y);

  return x + y;
}

function c(x, y: t.String): t.String {
  y = t.String(y);

  const ret = function (x, y) {
    return x + y;
  }(x, y);

  return t.String(ret);
}

function d(x: a.b.c.User) {
  x = a.b.c.User(x);

  return x;
}
