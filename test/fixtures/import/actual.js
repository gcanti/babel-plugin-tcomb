import tc from 'tcomb';

function foo(x: ?tc.String) {
  return x || 'Empty';
}