import t from 'tcomb';

function foo(): any {
  const ret = function () {}.call(this);

  _assert(ret, t.Any, 'return value');

  return ret;
}