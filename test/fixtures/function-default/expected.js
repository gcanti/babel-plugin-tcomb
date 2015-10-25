function foo(x = 0, y: t.String) {
  x = t.Number(x);
  y = t.String(y);

  return x + y;
}
