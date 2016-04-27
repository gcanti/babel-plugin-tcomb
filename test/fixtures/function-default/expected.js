import t from 'tcomb';

function foo(x: t.Number, y = 1: t.Number) {
  t.assert(t.Number.is(x), function () {
    t.Number(x);
    return 'Invalid argument x (expected a ' + t.getTypeName(t.Number) + ')';
  });
  t.assert(t.Number.is(y), function () {
    t.Number(y);
    return 'Invalid argument y (expected a ' + t.getTypeName(t.Number) + ')';
  });

  return x + y;
}
