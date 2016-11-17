function foo({ x }) {
  _assert(arguments[0], _t.interface({
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
  _assert(arguments[0] !== undefined ? arguments[0] : {}, _t.interface({
    x: _t.interface({
      y: _t.maybe(_t.String)
    })
  }), "{ x: { y = \"ex\" } }");

  return x;
}
