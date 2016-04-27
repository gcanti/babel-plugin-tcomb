import t from 'tcomb';

function foo(x: [t.String, t.Number]) {
  t.assert(t.tuple([t.String, t.Number]).is(x), function () {
    t.tuple([t.String, t.Number])(x);
    return 'Invalid argument x (expected a ' + t.getTypeName(t.tuple([t.String, t.Number])) + ')';
  });

  return x;
}
