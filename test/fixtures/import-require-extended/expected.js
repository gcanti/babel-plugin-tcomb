const TR = require('tcomb-react');

function foo(x: ?TR.t.String) {
  TR.t.assert(TR.t.maybe(TR.t.String).is(x));

  return x || 'Empty';
}
