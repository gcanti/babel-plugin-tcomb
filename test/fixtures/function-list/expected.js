import t from 'tcomb';

function foo(x: Array<t.String>) {
  t.assert(t.is(x, t.list(t.String)), 'Invalid argument x (expected a ' + t.getTypeName(t.list(t.String)) + ')');

  return x;
}

function bar(x: t.String[]) {
  t.assert(t.is(x, t.list(t.String)), 'Invalid argument x (expected a ' + t.getTypeName(t.list(t.String)) + ')');

  return x;
}

function baz(x: Array<string>) {
  t.assert(t.is(x, t.list(t.String)), 'Invalid argument x (expected a ' + t.getTypeName(t.list(t.String)) + ')');

  return x;
}

function foobaz(x: Array<Promise<T>>) {
  t.assert(t.is(x, t.list(Promise)), 'Invalid argument x (expected a ' + t.getTypeName(t.list(Promise)) + ')');

  return x;
}
