function foo() {
  const ret = function () {}.call(this);

  _assert(ret, _t.Any, "return value");

  return ret;
}