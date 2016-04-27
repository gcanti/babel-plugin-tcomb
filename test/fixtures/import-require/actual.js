const tc = require('tcomb');

function foo(x: ?tc.String) {
  return x || 'Empty';
}