import t from 'tcomb';

function foo({ x }) {
  _assert(arguments[0], t.interface({
    x: t.String
  }), 'arguments[0]');

  return bar;
}

function bar({ a } = {}) {
  const ret = function ({ a }) {
    return x;
  }.call(this, { a });

  _assert(ret, t.String, 'return value');

  return ret;
}