let { foo, y } = _assert(x(), _t.interface({
  foo: _t.Boolean,
  y: _t.interface({
    bar: _t.String
  })
}), 'destructuring value');

foo = _assert('foo', _t.String, 'foo');;
