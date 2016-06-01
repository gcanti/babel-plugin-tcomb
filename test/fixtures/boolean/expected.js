import t from 'tcomb';

function foo(x: bool) {
  t.assert(t.is(x, t.Boolean), 'Invalid argument x (expected a ' + t.getTypeName(t.Boolean) + ')');

  return x;
}

function bar(x: bool) {
  t.assert(t.is(x, t.Boolean), 'Invalid argument x (expected a ' + t.getTypeName(t.Boolean) + ')');

  return x;
}