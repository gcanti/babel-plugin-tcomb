import tc from 'tcomb';
import { propTypes } from 'tcomb-react';

function foo(x: ?tc.String) {
  tc.assert(tc.maybe(tc.String).is(x), 'Invalid argument x (expected a ' + tc.getTypeName(tc.maybe(tc.String)) + ')');

  return x || 'Empty';
}