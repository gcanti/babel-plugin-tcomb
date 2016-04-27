import t from 'tcomb';

function foo(x: Array<t.String>) {
  t.assert(t.list(t.String).is(x), function () {
    t.list(t.String)(x);
    return 'Invalid argument x (expected a ' + t.getTypeName(t.list(t.String)) + ')';
  });

  return x;
}

function bar(x: t.String[]) {
  t.assert(t.list(t.String).is(x), function () {
    t.list(t.String)(x);
    return 'Invalid argument x (expected a ' + t.getTypeName(t.list(t.String)) + ')';
  });

  return x;
}
