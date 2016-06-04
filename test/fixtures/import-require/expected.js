const tc = require('tcomb');

function foo(x: ?tc.String) {
  _assert(x, tc.maybe(tc.String), 'x');

  return x || 'Empty';
}
