function foo(x, y = 1) {
  _assert(x, _t.Number, "x");

  _assert(y, _t.Number, "y");

  return x + y;
}

function bar(x, y = 1) {
  _assert(x, _t.Number, "x");

  _assert(y, _t.maybe(_t.Number), "y");

  return x + y;
}
