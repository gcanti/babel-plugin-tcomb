function foo(x) {
  _assert(x, _t.list(_t.tuple([_t.maybe(_t.Number), _t.String])), "x");

  return x;
}
