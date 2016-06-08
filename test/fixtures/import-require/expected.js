const tc = require('tcomb');

function foo(x) {
  _assert(x, tc.maybe(tc.String), 'x');

  return x || 'Empty';
}
