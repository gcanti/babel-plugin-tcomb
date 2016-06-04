import t from 'tcomb';

function foo(x: t.Number, y: t.String): t.String {
  _assert(x, t.Number, 'x');

  _assert(y, t.String, 'y');

  const ret = function (x, y) {
    return x + y;
  }.call(this, x, y);

  _assert(ret, t.String, 'return value');

  return ret;
}

function bar(x, y: t.String): t.String {
  _assert(y, t.String, 'y');

  const ret = function (x, y) {
    return x + y;
  }.call(this, x, y);

  _assert(ret, t.String, 'return value');

  return ret;
}
