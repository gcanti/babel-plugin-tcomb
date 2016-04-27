import t from 'tcomb';

function foo(x: Array<t.String>) {
  t.assert(t.list(t.String).is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.list(t.String)) + ')');

  return x;
}

function bar(x: t.String[]) {
  t.assert(t.list(t.String).is(x), 'Invalid argument x (expected a ' + t.getTypeName(t.list(t.String)) + ')');

  return x;
}
