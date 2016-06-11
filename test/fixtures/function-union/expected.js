function foo(x) {
  _assert(x, _t.union([_t.String, _t.Number]), "x");

  return x;
}
