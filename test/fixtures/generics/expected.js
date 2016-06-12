function foo(p) {
  _assert(p, typeof Promise !== "undefined" ? Promise : _t.Any, "p");

  const ret = function (p) {}.call(this, p);

  _assert(ret, _t.Nil, "return value");

  return ret;
}