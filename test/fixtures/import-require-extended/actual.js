const TR = require('tcomb-react');

function foo(x: ?TR.t.String) {
  return x || 'Empty';
}