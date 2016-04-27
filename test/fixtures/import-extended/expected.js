import { t as tc } from 'tcomb-react';

function foo(x: ?tc.String) {
  tc.assert(tc.maybe(tc.String).is(x));

  return x || 'Empty';
}
