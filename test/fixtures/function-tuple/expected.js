function foo(x) {
  _assert(x, _t.tuple([_t.String, _t.Number]), "x");

  return x;
}
