function foo({ x }) {
  _assert({
    x
  }, _t.interface({
    x: _t.String
  }), "{ x }");

  return bar;
}

function bar({ a } = {}) {
  const ret = function ({
    a
  }) {
    return x;
  }.call(this, {
    a
  });

  _assert(ret, _t.String, "return value");

  return ret;
}

function baz({ x: { y = "ex" } } = {}) {
  _assert({
    x: {
      y
    }
  }, _t.interface({
    x: _t.interface({
      y: _t.maybe(_t.String)
    })
  }), "{ x: { y } }");

  return x;
}
