import tc from 'tcomb';
import { propTypes } from 'tcomb-react';

function foo(x: ?tc.String) {
  _assert(x, tc.maybe(tc.String), 'x');

  return x || 'Empty';
}
