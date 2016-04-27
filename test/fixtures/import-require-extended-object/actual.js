const { t } = require('tcomb-react');

function foo(x: ?t.String) {
  return x || 'Empty';
}