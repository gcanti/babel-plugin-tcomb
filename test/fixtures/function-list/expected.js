function foo(x) {
  _assert(x, _t.list(_t.String), "x");

  return x;
}

function bar(x) {
  _assert(x, _t.list(_t.String), "x");

  return x;
}

function baz(x) {
  _assert(x, _t.list(Promise), "x");

  return x;
}
