import t from 'tcomb';

function foo(): void {
  const ret = function () {}.call(this);

  _assert(ret, t.Nil, 'return value');

  return ret;
}

function bar(): null {
  const ret = function () {}.call(this);

  _assert(ret, t.Nil, 'return value');

  return ret;
}