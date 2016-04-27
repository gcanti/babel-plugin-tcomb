import t from 'tcomb';

function foo(x: t.Number, y: t.String) {
  t.assert(t.Number.is(x), function () {
    t.Number(x);
    return 'Invalid argument x (expected a ' + t.getTypeName(t.Number) + ')';
  });
  t.assert(t.String.is(y), function () {
    t.String(y);
    return 'Invalid argument y (expected a ' + t.getTypeName(t.String) + ')';
  });

  return x + y;
}
