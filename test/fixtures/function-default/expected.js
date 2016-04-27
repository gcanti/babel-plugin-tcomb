import t from 'tcomb';

function foo(x: t.Number, y = 1: t.Number) {
  t.assert(t.Number.is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.Number) + ')');
  t.assert(t.Number.is(y), 'Invalid argument y (expected a ' + t.getTypeName(t.Number) + ')');

  return x + y;
}

function bar(x: t.Number, y = 1) {
  t.assert(t.Number.is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.Number) + ')');
  t.assert(t.Number.is(y), 'Invalid argument y (expected a ' + t.getTypeName(t.Number) + ')');

  return x + y;
}
