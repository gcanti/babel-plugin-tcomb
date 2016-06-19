function foo(p) {
  _assert(p, Promise, "p");

  const ret = function (p) {}.call(this, p);

  _assert(ret, _t.Nil, "return value");

  return ret;
}