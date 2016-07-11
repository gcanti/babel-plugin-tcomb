const foo = _assert(x(), _t.interface({
  foo: _t.Boolean,
  y: _t.interface({
    bar: _t.String
  })
}), "foo");
