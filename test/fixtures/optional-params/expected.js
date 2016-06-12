function foo(a) {
  _assert(a, _t.maybe(_t.String), "a");
}

function bar(a) {
  _assert(a, _t.interface({
    b: _t.maybe(_t.String)
  }), "a");
}
