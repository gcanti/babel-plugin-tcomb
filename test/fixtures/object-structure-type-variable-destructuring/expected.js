let { foo, y } = function (_foo$y) {
  _assert(_foo$y, _t.interface({
    foo: _t.Boolean,
    y: _t.interface({
      bar: _t.String
    })
  }), '_foo$y');

  return _foo$y;
}(x());

foo = 'foo';

_assert(bar, _t.String, 'foo');
