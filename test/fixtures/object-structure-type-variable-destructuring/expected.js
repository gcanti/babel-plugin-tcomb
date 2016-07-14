let { foo, y: { bar } } = _assert(x(), _t.interface({
  foo: _t.Boolean,
  y: _t.interface({
    bar: _t.String
  })
}), "{ foo, y: { bar } }");

bar = _assert(x, _t.String, "bar");
