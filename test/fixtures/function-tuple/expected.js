import t from 'tcomb';

function foo(x: [t.String, t.Number]) {
  t.assert(t.is(x, t.tuple([t.String, t.Number])), 'Invalid argument x (expected a ' + t.getTypeName(t.tuple([t.String, t.Number])) + ')');

  return x;
}
