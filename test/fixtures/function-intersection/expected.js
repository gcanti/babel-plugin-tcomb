function foo(x) {
  _assert(x, _t.intersection([_t.Number, _t.String]), "x");

  return x;
}
