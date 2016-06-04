const TR = require('tcomb-react');

function foo(x: ?TR.t.String) {
  _assert(x, TR.t.maybe(TR.t.String), 'x');

  return x || 'Empty';
}
