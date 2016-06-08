import tc from 'tcomb';
import { propTypes } from 'tcomb-react';

function foo(x) {
  _assert(x, tc.maybe(tc.String), 'x');

  return x || 'Empty';
}
