const TR = require('tcomb-react');

function foo(x: ?TR.t.String) {
  TR.t.assert(TR.t.is(x, TR.t.maybe(TR.t.String)), 'Invalid argument x (expected a ' + TR.t.getTypeName(TR.t.maybe(TR.t.String)) + ')');

  return x || 'Empty';
}
