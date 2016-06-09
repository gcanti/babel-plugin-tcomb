import t from 'tcomb';

function foo() {
  const ret = function () {}.call(this);

  _assert(ret, t.Nil, 'return value');

  return ret;
}

function bar() {
  const ret = function () {}.call(this);

  _assert(ret, t.Nil, 'return value');

  return ret;
}