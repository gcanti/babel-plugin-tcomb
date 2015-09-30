import tc from 'tcomb';

function foo(x: ?tc.String) {
  x = tc.maybe(tc.String)(x);

  return x || 'Empty';
}