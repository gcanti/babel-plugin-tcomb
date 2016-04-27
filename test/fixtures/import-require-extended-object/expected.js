const { t } = require('tcomb-react');

function foo(x: ?t.String) {
  t.assert(t.maybe(t.String).is(x), function () {
    t.maybe(t.String)(x);
    return 'Invalid argument x (expected a ' + t.getTypeName(t.maybe(t.String)) + ')';
  });

  return x || 'Empty';
}
