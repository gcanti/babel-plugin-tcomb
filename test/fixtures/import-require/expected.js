const tc = require('tcomb');

function foo(x: ?tc.String) {
  tc.assert(tc.maybe(tc.String).is(x), 'Invalid argument x (expected a ' + tc.getTypeName(tc.maybe(tc.String)) + ')');

  return x || 'Empty';
}
