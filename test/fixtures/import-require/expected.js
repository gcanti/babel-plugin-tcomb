const tc = require('tcomb');

function foo(x: ?tc.String) {
  tc.assert(tc.is(x, tc.maybe(tc.String)), 'Invalid argument x (expected a ' + tc.getTypeName(tc.maybe(tc.String)) + ')');

  return x || 'Empty';
}
