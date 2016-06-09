const { t } = require('tcomb-react');

function foo(x) {
  _assert(x, t.maybe(t.String), 'x');

  return x || 'Empty';
}
