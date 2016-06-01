import { Number } from 'tcomb';

function sum(a: Number, b: Number): Number {
  require('tcomb').assert(require('tcomb').is(a, Number), 'Invalid argument a (expected a ' + require('tcomb').getTypeName(Number) + ')');

  require('tcomb').assert(require('tcomb').is(b, Number), 'Invalid argument b (expected a ' + require('tcomb').getTypeName(Number) + ')');

  const ret = function (a, b) {
    return a + b;
  }.call(this, a, b);

  require('tcomb').assert(require('tcomb').is(ret, Number), 'Invalid argument ret (expected a ' + require('tcomb').getTypeName(Number) + ')');

  return ret;
}