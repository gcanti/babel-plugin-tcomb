function foo(x, ...rest) {
  _assert(x, _t.Number, "x");

  _assert(rest, _t.list(_t.String), "rest");
}

function bar(x, ...rest) {
  _assert(x, _t.Number, "x");

  _assert(rest, _t.maybe(_t.list(_t.String)), "rest");
}

function baz(x, ...rest) {
  _assert(x, _t.Number, "x");

  _assert(rest, _t.maybe(_t.list(_t.String)), "rest");

  const ret = function (x, ...rest) {}.call(this, x, ...rest);

  _assert(ret, _t.String, "return value");

  return ret;
}
