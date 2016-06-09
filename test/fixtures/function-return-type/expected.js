import t from 'tcomb';

function foo(x, y) {
  _assert(x, t.Number, 'x');

  _assert(y, t.String, 'y');

  const ret = function (x, y) {
    return x + y;
  }.call(this, x, y);

  _assert(ret, t.String, 'return value');

  return ret;
}

function bar(x, y) {
  _assert(y, t.String, 'y');

  const ret = function (x, y) {
    return x + y;
  }.call(this, x, y);

  _assert(ret, t.String, 'return value');

  return ret;
}
