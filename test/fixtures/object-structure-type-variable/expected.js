const foo = x();

_assert(foo, _t.interface({
  foo: _t.Boolean,
  y: _t.interface({
    bar: _t.String
  })
}), "foo");
