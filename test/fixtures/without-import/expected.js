import { Number } from 'tcomb';

function sum(a, b) {
  _assert(a, typeof Number !== "undefined" ? Number : _t.Any, 'a');

  _assert(b, typeof Number !== "undefined" ? Number : _t.Any, 'b');

  const ret = function (a, b) {
    return a + b;
  }.call(this, a, b);

  _assert(ret, typeof Number !== "undefined" ? Number : _t.Any, 'return value');

  return ret;
}