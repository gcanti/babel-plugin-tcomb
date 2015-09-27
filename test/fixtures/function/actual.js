function a(x: t.Number, y: t.String): t.String {
  return x + y;
}

function b(x: t.Number, y: t.String) {
  return x + y;
}

function c(x, y: t.String): t.String {
  return x + y;
}

function d(x: a.b.c.User) {
  return x;
}

