import t from 'tcomb';

function foo(p) {
  _assert(p, typeof Promise !== "undefined" ? Promise : t.Any, 'p');

  const ret = function (p) {}.call(this, p);

  _assert(ret, t.Nil, 'return value');

  return ret;
}