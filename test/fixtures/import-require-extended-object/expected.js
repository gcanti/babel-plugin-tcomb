const { t } = require('tcomb-react');

function foo(x: ?t.String) {
  t.assert(t.maybe(t.String).is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.maybe(t.String)) + ')');

  return x || 'Empty';
}
