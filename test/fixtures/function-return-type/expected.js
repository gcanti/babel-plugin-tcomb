function foo(x, y) {
  _assert(x, _t.Number, "x");

  _assert(y, _t.String, "y");

  const ret = function (x, y) {
    return x + y;
  }.call(this, x, y);

  _assert(ret, _t.String, "return value");

  return ret;
}

function bar(x, y) {
  _assert(y, _t.String, "y");

  const ret = function (x, y) {
    return x + y;
  }.call(this, x, y);

  _assert(ret, _t.String, "return value");

  return ret;
}
