import { Number } from 'tcomb';

function sum(a: Number, b: Number): Number {
  _assert(a, Number, 'a');

  _assert(b, Number, 'b');

  const ret = function (a, b) {
    return a + b;
  }.call(this, a, b);

  _assert(ret, Number, 'return value');

  return ret;
}