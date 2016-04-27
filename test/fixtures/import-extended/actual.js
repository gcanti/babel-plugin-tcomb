import { t as tc } from 'tcomb-react';

function foo(x: ?tc.String) {
  return x || 'Empty';
}
