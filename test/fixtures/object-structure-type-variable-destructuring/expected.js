let { foo, y: { bar } } = _assert(x(), _t.interface({
  foo: _t.Boolean,
  y: _t.interface({
    bar: _t.String
  })
}), 'destructuring value');

bar = _assert('foo', _t.String, 'bar');
