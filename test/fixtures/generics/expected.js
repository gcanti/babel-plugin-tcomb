function foo(p) {
  _assert(p, _t.Promise, "p");

  const ret = function (p) {}.call(this, p);

  _assert(ret, _t.Nil, "return value");

  return ret;
}
