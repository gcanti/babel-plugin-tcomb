function foo({ x }) {
  _assert(arguments[0], _t.interface({
    x: _t.String
  }), "arguments[0]");

  return bar;
}

function bar({ a } = {}) {
  const ret = function ({ a }) {
    return x;
  }.call(this, { a });

  _assert(ret, _t.String, "return value");

  return ret;
}