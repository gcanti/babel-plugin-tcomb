import tc from 'tcomb';
import { propTypes } from 'tcomb-react';

function foo(x: ?tc.String) {
  return x || 'Empty';
}
