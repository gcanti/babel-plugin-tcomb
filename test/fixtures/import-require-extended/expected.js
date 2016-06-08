const TR = require('tcomb-react');

function foo(x) {
  _assert(x, TR.t.maybe(TR.t.String), 'x');

  return x || 'Empty';
}
